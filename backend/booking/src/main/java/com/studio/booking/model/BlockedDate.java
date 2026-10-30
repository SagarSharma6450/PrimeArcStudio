package com.studio.booking.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

/** A full day the architect is unavailable (holiday, travel...). */
@Entity
@Table(name = "blocked_dates")
@Getter @Setter
public class BlockedDate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "blocked_on", unique = true)
    private LocalDate date;
}
