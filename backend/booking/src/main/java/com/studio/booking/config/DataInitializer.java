package com.studio.booking.config;

import com.studio.booking.model.*;
import com.studio.booking.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/** Seeds starter data on first run only. Edit everything later from the admin dashboard. */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private final AvailabilityRepository availability;
    private final ServiceRepository services;

    @Override
    public void run(String... args) {
        if (availability.count() == 0) {
            for (int d = 1; d <= 7; d++) {                 // Mon-Sat 10:00-18:00, Sunday off
                AvailabilityRule r = new AvailabilityRule();
                r.setDayOfWeek(d);
                r.setEnabled(d != 7);
                r.setStartHour(10);
                r.setEndHour(18);
                availability.save(r);
            }
        }
        if (services.count() == 0) {                       // placeholders - replace from the admin dashboard
            add("Interior Design Consultation", "One hour to discuss your space, style and budget.", 1500);
            add("Architectural Consultation", "One hour on plans, layout and approvals for your project.", 2000);
        }
    }

    private void add(String name, String desc, int price) {
        ServiceItem s = new ServiceItem();
        s.setName(name); s.setDescription(desc); s.setPrice(price);
        services.save(s);
    }
}
