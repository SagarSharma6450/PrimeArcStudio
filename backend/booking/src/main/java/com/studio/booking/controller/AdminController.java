package com.studio.booking.controller;

import com.studio.booking.config.JwtService;
import com.studio.booking.dto.Dtos;
import com.studio.booking.exception.ApiException;
import com.studio.booking.model.*;
import com.studio.booking.model.Appointment.Status;
import com.studio.booking.repo.*;
import com.studio.booking.service.SlotService;
import jakarta.annotation.PostConstruct;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final ServiceRepository services;
    private final AppointmentRepository appointments;
    private final AvailabilityRepository availability;
    private final BlockedDateRepository blocked;
    private final JwtService jwt;
    private final PasswordEncoder encoder;
    private final SlotService slots;
    @Value("${app.admin.email}") private String adminEmail;
    @Value("${app.admin.password}") private String adminPassword;
    private String adminHash;

    @PostConstruct
    void init() { adminHash = encoder.encode(adminPassword); }

    // ---------- login ----------
    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Dtos.LoginRequest r) {
        boolean ok = r.email() != null && r.password() != null
                && adminEmail.equalsIgnoreCase(r.email().trim()) && encoder.matches(r.password(), adminHash);
        if (!ok) throw new ApiException(401, "Invalid email or password");
        return Map.of("token", jwt.create(adminEmail));
    }

    // ---------- appointments ----------
    @GetMapping("/appointments")
    public List<Appointment> appointments(@RequestParam(defaultValue = "upcoming") String view) {
        LocalDateTime now = slots.now();
        List<Appointment> all = appointments.findAll(Sort.by("date", "startTime"));
        switch (view) {
            case "past": {
                List<Appointment> r = all.stream()
                        .filter(a -> a.getStatus() == Status.CONFIRMED && !end(a).isAfter(now))
                        .collect(Collectors.toList());
                Collections.reverse(r);                 // most recent first
                return r;
            }
            case "cancelled":
                return all.stream().filter(a -> a.getStatus() == Status.CANCELLED).collect(Collectors.toList());
            default:
                return all.stream().filter(a -> a.getStatus() == Status.CONFIRMED && end(a).isAfter(now))
                        .collect(Collectors.toList());
        }
    }

    private LocalDateTime end(Appointment a) { return a.getDate().atTime(a.getStartTime()).plusHours(1); }

    @PutMapping("/appointments/{id}/cancel")
    @Transactional
    public void cancel(@PathVariable Long id) {
        Appointment a = appointments.findById(id).orElseThrow(() -> new ApiException(404, "Not found"));
        a.setStatus(Status.CANCELLED);
        a.setSlotKey(null);                              // frees the slot for others
    }

    // ---------- services & prices ----------
    @GetMapping("/services")
    public List<ServiceItem> allServices() { return services.findAll(Sort.by("id")); }

    @PostMapping("/services")
    public ServiceItem addService(@Valid @RequestBody ServiceItem s) { s.setId(null); return services.save(s); }

    @PutMapping("/services/{id}")
    public ServiceItem updateService(@PathVariable Long id, @Valid @RequestBody ServiceItem in) {
        ServiceItem s = services.findById(id).orElseThrow(() -> new ApiException(404, "Not found"));
        s.setName(in.getName());
        s.setDescription(in.getDescription());
        s.setPrice(in.getPrice());
        s.setActive(in.isActive());
        return services.save(s);
    }

    // ---------- weekly availability ----------
    @GetMapping("/availability")
    public List<AvailabilityRule> rules() { return availability.findAllByOrderByDayOfWeekAsc(); }

    @PutMapping("/availability")
    @Transactional
    public List<AvailabilityRule> saveRules(@RequestBody List<Dtos.AvailabilityDto> in) {
        for (Dtos.AvailabilityDto d : in) {
            if (d.startHour() < 0 || d.endHour() > 24 || d.startHour() >= d.endHour())
                throw new ApiException(400, "End time must be after start time");
            AvailabilityRule r = availability.findByDayOfWeek(d.dayOfWeek())
                    .orElseThrow(() -> new ApiException(400, "Invalid day"));
            r.setEnabled(d.enabled());
            r.setStartHour(d.startHour());
            r.setEndHour(d.endHour());
        }
        return availability.findAllByOrderByDayOfWeekAsc();
    }

    // ---------- blocked dates ----------
    @GetMapping("/blocked-dates")
    public List<BlockedDate> blockedDates() { return blocked.findAllByOrderByDateAsc(); }

    @PostMapping("/blocked-dates")
    public BlockedDate block(@Valid @RequestBody Dtos.DateRequest r) {
        if (blocked.existsByDate(r.date())) throw new ApiException(409, "Date already blocked");
        BlockedDate b = new BlockedDate();
        b.setDate(r.date());
        return blocked.save(b);
    }

    @DeleteMapping("/blocked-dates/{id}")
    public void unblock(@PathVariable Long id) { blocked.deleteById(id); }
}
