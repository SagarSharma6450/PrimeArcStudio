package com.studio.booking.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public class Dtos {
    public record BookingRequest(
            @NotNull Long serviceId,
            @NotNull LocalDate date,
            @NotBlank String time,
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit mobile number") String phone,
            @NotBlank @Email String email) {}

    public record Checkout(Long appointmentId, String orderId, int amount, String currency, String keyId) {}
    public record VerifyRequest(@NotBlank String orderId, @NotBlank String paymentId, @NotBlank String signature) {}
    public record ReleaseRequest(@NotBlank String orderId) {}
    public record Summary(String service, LocalDate date, String time, int amount, String paymentId) {}
    public record ReviewRequest(
        @NotBlank(message = "Please enter your name") @Size(max = 60) String name,
        @NotBlank(message = "Please write your review") @Size(min = 10, max = 500, message = "Please write between 10 and 500 characters") String message,
        @NotNull(message = "Please choose a star rating") @Min(1) @Max(5) Integer rating,
        String website) {}
    public record PublicReview(String name, String message, Integer rating) {}
    public record Slot(String time, boolean available) {}
    public record LoginRequest(String email, String password) {}
    public record AvailabilityDto(int dayOfWeek, boolean enabled, int startHour, int endHour) {}
    public record DateRequest(@NotNull LocalDate date) {}
}
