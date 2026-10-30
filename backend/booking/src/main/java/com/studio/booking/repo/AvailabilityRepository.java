package com.studio.booking.repo;

import com.studio.booking.model.AvailabilityRule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AvailabilityRepository extends JpaRepository<AvailabilityRule, Long> {
    Optional<AvailabilityRule> findByDayOfWeek(int dayOfWeek);
    List<AvailabilityRule> findAllByOrderByDayOfWeekAsc();
}
