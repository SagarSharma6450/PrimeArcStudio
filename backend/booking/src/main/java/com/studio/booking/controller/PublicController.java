package com.studio.booking.controller;

import com.studio.booking.dto.Dtos;
import com.studio.booking.model.Review;
import com.studio.booking.model.ServiceItem;
import com.studio.booking.repo.ReviewRepository;
import com.studio.booking.repo.ServiceRepository;
import com.studio.booking.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PublicController {
    private final ServiceRepository services;
    private final ReviewRepository reviews;
    private final SlotService slots;
    private final BookingService bookings;

    @GetMapping("/services")
    public List<ServiceItem> services() { return services.findByActiveTrueOrderByPriceAsc(); }

    @GetMapping("/dates")
    public List<LocalDate> dates() { return slots.availableDates(30); }

    @GetMapping("/slots")
    public List<Dtos.Slot> slots(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return slots.slotsFor(date);
    }

    @PostMapping("/bookings")
    public Dtos.Checkout book(@Valid @RequestBody Dtos.BookingRequest r) { return bookings.startBooking(r); }

    @PostMapping("/bookings/verify")
    public Dtos.Summary verify(@Valid @RequestBody Dtos.VerifyRequest r) { return bookings.confirm(r); }

    @PostMapping("/bookings/release")
    public void release(@Valid @RequestBody Dtos.ReleaseRequest r) { bookings.release(r.orderId()); }

    // ---------- reviews ----------
    /** Only reviews the admin has chosen to show. */
    @GetMapping("/reviews")
    public List<Dtos.PublicReview> publicReviews() {
        return reviews.findByApprovedTrueOrderByCreatedAtDesc().stream()
                .map(r -> new Dtos.PublicReview(r.getName(), r.getMessage())).toList();
    }

    /** Anyone can submit. It is saved as hidden until the admin approves it. */
    @PostMapping("/reviews")
    public void submitReview(@Valid @RequestBody Dtos.ReviewRequest r) {
        if (r.website() != null && !r.website().isBlank()) return;   // hidden trap field: only bots fill it
        Review review = new Review();
        review.setName(r.name().trim());
        review.setMessage(r.message().trim());
        reviews.save(review);
    }
}
