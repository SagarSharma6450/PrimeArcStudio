package com.studio.booking.service;

import com.studio.booking.dto.Dtos;
import com.studio.booking.exception.ApiException;
import com.studio.booking.model.*;
import com.studio.booking.model.Appointment.*;
import com.studio.booking.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {
    private final AppointmentRepository appointments;
    private final ServiceRepository services;
    private final SlotService slots;
    private final PaymentService payments;
    private final EmailService email;
    @Value("${app.hold-minutes}") private int holdMinutes;

    /** Step 1: customer clicks Pay. Hold the slot and create a Razorpay order. */
    @Transactional
    public Dtos.Checkout startBooking(Dtos.BookingRequest r) {
        ServiceItem s = services.findById(r.serviceId()).filter(ServiceItem::isActive)
                .orElseThrow(() -> new ApiException(404, "Service not found"));
        LocalTime time;
        try { time = LocalTime.parse(r.time()); } catch (Exception e) { throw new ApiException(400, "Invalid time"); }

        releaseExpiredHolds();
        if (!slots.isBookable(r.date(), time))
            throw new ApiException(409, "Sorry, that slot is no longer available. Please pick another.");

        Appointment a = new Appointment();
        a.setService(s);
        a.setServiceName(s.getName());
        a.setAmount(s.getPrice());
        a.setCustomerName(r.name().trim());
        a.setPhone(r.phone());
        a.setEmail(r.email().trim());
        a.setDate(r.date());
        a.setStartTime(time);
        a.setSlotKey(SlotService.key(r.date(), time));
        a.setHoldExpiresAt(slots.now().plusMinutes(holdMinutes));
        try {
            appointments.saveAndFlush(a);       // UNIQUE(slot_key) rejects a simultaneous second booking
        } catch (DataIntegrityViolationException e) {
            throw new ApiException(409, "Sorry, someone just booked that slot. Please pick another.");
        }

        String orderId = payments.createOrder(s.getPrice() * 100, "apt_" + a.getId());
        a.setRazorpayOrderId(orderId);
        return new Dtos.Checkout(a.getId(), orderId, s.getPrice() * 100, "INR", payments.getKeyId());
    }

    /** Step 2: Razorpay returns payment details to the browser, which sends them here. */
    @Transactional(noRollbackFor = ApiException.class)
    public Dtos.Summary confirm(Dtos.VerifyRequest v) {
        Appointment a = appointments.findByRazorpayOrderId(v.orderId())
                .orElseThrow(() -> new ApiException(404, "Booking not found"));
        if (a.getStatus() == Status.CONFIRMED) return summary(a);     // already confirmed (safe to call twice)

        if (!payments.verify(v.orderId(), v.paymentId(), v.signature()))
            throw new ApiException(400, "Payment could not be verified. If money was deducted, contact us.");

        a.setRazorpayPaymentId(v.paymentId());
        a.setPaymentStatus(PaymentStatus.PAID);

        if (a.getStatus() != Status.PENDING) {               // hold had expired / been released before payment finished
            if (slots.isTaken(a.getDate(), a.getStartTime())) {
                a.setStatus(Status.CANCELLED);
                a.setSlotKey(null);
                appointments.save(a);
                throw new ApiException(409, "Your payment was received but the slot was taken meanwhile. "
                        + "A refund will be issued - please contact us.");
            }
            a.setSlotKey(SlotService.key(a.getDate(), a.getStartTime()));
        }
        a.setStatus(Status.CONFIRMED);
        a.setHoldExpiresAt(null);
        appointments.saveAndFlush(a);
        email.sendConfirmation(a);
        return summary(a);
    }

    /** Customer closed the payment popup: free the slot immediately. */
    @Transactional
    public void release(String orderId) {
        appointments.findByRazorpayOrderId(orderId).filter(a -> a.getStatus() == Status.PENDING).ifPresent(a -> {
            a.setStatus(Status.EXPIRED);
            a.setSlotKey(null);
        });
    }

    private void releaseExpiredHolds() {
        List<Appointment> old = appointments.findByStatusAndHoldExpiresAtBefore(Status.PENDING, slots.now());
        old.forEach(a -> { a.setStatus(Status.EXPIRED); a.setSlotKey(null); });
        appointments.saveAllAndFlush(old);
    }

    private Dtos.Summary summary(Appointment a) {
        return new Dtos.Summary(a.getServiceName(), a.getDate(), a.getStartTime().toString(), a.getAmount(), a.getRazorpayPaymentId());
    }
}
