package com.studio.booking.repo;

import com.studio.booking.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByDateBetweenAndSlotKeyIsNotNull(LocalDate from, LocalDate to);
    Optional<Appointment> findByRazorpayOrderId(String orderId);
    List<Appointment> findByStatusAndHoldExpiresAtBefore(Appointment.Status status, LocalDateTime time);
}
