package com.quickbite.delivery;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DeliveryStatusHistoryRepository extends JpaRepository<DeliveryStatusHistory, Long> {
    List<DeliveryStatusHistory> findByDeliveryIdOrderByChangedAtAsc(Long deliveryId);
}
