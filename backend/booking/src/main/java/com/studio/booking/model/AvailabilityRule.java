package com.studio.booking.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** One row per weekday (1 = Monday ... 7 = Sunday). Slots are one hour each from startHour to endHour. */
@Entity
@Table(name = "availability_rules")
@Getter @Setter
public class AvailabilityRule {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "day_of_week", unique = true)
    private int dayOfWeek;
    private boolean enabled;
    private int startHour;
    private int endHour;
}
