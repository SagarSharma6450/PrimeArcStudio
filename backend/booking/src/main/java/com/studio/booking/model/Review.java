package com.studio.booking.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

/** A customer review. It stays hidden (approved = false) until the admin shows it. */
@Entity
@Table(name = "reviews")
@Getter @Setter
public class Review {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @Column(length = 1000)
    private String message;
    private boolean approved = false;
    private LocalDateTime createdAt = LocalDateTime.now();
}
