package com.studio.booking.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.*;

/**
 * slotKey (e.g. "2026-11-02T10:00") is filled ONLY while the appointment holds a slot
 * (PENDING hold or CONFIRMED). It has a UNIQUE index, so MySQL itself blocks double bookings.
 * Cancelled / expired rows set it to NULL (MySQL allows many NULLs in a unique index).
 */
@Entity
@Table(name = "appointments", uniqueConstraints = @UniqueConstraint(columnNames = "slot_key"))
@Getter @Setter
public class Appointment {
    public enum Status { PENDING, CONFIRMED, CANCELLED, EXPIRED }
    public enum PaymentStatus { CREATED, PAID }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    private ServiceItem service;
    private String serviceName;          // snapshot, so later price/name edits don't change history
    private int amount;                  // rupees, snapshot

    private String customerName;
    private String phone;
    private String email;

    @Column(name = "appt_date") private LocalDate date;
    @Column(name = "start_time") private LocalTime startTime;

    @Enumerated(EnumType.STRING) private Status status = Status.PENDING;
    @Enumerated(EnumType.STRING) private PaymentStatus paymentStatus = PaymentStatus.CREATED;

    @Column(name = "slot_key") private String slotKey;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private LocalDateTime holdExpiresAt;
    private LocalDateTime createdAt = LocalDateTime.now();
}
