package com.studio.booking.repo;

import com.studio.booking.model.ServiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServiceRepository extends JpaRepository<ServiceItem, Long> {
    List<ServiceItem> findByActiveTrueOrderByPriceAsc();
}
