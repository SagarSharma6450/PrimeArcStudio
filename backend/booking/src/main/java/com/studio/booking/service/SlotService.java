package com.studio.booking.service;

import com.studio.booking.dto.Dtos;
import com.studio.booking.model.Appointment;
import com.studio.booking.model.AvailabilityRule;
import com.studio.booking.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.time.*;
import java.util.*;
import java.util.stream.*;

@Service
@RequiredArgsConstructor
public class SlotService {
    private final AvailabilityRepository availability;
    private final BlockedDateRepository blocked;
    private final AppointmentRepository appointments;
    @Value("${app.timezone}") private String tz;

    public LocalDateTime now() { return LocalDateTime.now(ZoneId.of(tz)); }

    public static String key(LocalDate d, LocalTime t) { return d + "T" + t; }

    /** All one-hour slots the architect works on this date (booked or not). */
    private List<LocalTime> workingSlots(LocalDate d) {
        if (blocked.existsByDate(d)) return List.of();
        return availability.findByDayOfWeek(d.getDayOfWeek().getValue())
                .filter(AvailabilityRule::isEnabled)
                .map(r -> IntStream.range(r.getStartHour(), r.getEndHour()).mapToObj(h -> LocalTime.of(h, 0)).toList())
                .orElse(List.of());
    }

    /** Slot keys that are confirmed, or held by a payment that has not expired yet. */
    private Set<String> taken(LocalDate from, LocalDate to) {
        LocalDateTime n = now();
        return appointments.findByDateBetweenAndSlotKeyIsNotNull(from, to).stream()
                .filter(a -> a.getStatus() == Appointment.Status.CONFIRMED
                        || (a.getHoldExpiresAt() != null && a.getHoldExpiresAt().isAfter(n)))
                .map(Appointment::getSlotKey).collect(Collectors.toSet());
    }

    public List<Dtos.Slot> slotsFor(LocalDate d) {
        Set<String> t = taken(d, d);
        LocalDateTime n = now();
        return workingSlots(d).stream()
                .map(s -> new Dtos.Slot(s.toString(), !t.contains(key(d, s)) && d.atTime(s).isAfter(n)))
                .toList();
    }

    public boolean isBookable(LocalDate d, LocalTime time) {
        return slotsFor(d).stream().anyMatch(s -> s.time().equals(time.toString()) && s.available());
    }

    public boolean isTaken(LocalDate d, LocalTime time) {
        return taken(d, d).contains(key(d, time));
    }

    /** Dates in the next N days that still have at least one free slot. */
    public List<LocalDate> availableDates(int days) {
        LocalDateTime n = now();
        LocalDate today = n.toLocalDate();
        Set<String> t = taken(today, today.plusDays(days));
        return IntStream.range(0, days).mapToObj(today::plusDays)
                .filter(d -> workingSlots(d).stream().anyMatch(s -> !t.contains(key(d, s)) && d.atTime(s).isAfter(n)))
                .toList();
    }
}
