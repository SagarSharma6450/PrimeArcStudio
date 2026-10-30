package com.studio.booking.repo;

import com.studio.booking.model.BlockedDate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface BlockedDateRepository extends JpaRepository<BlockedDate, Long> {
    boolean existsByDate(LocalDate date);
    List<BlockedDate> findAllByOrderByDateAsc();
}
