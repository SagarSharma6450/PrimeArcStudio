package com.studio.booking.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "services")
@Getter @Setter
public class ServiceItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank
    private String name;
    @Column(length = 1000)
    private String description;
    @Min(1)
    private int price;          // in rupees
    private boolean active = true;
}
