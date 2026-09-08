package com.quickbite.delivery;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliveryRepository extends JpaRepository<Delivery, Long> {

    boolean existsByOrderId(Long orderId);

    Optional<Delivery> findByOrderId(Long orderId);

    java.util.List<Delivery> findByStatus(DeliveryStatus status);

    java.util.List<Delivery> findByDriverId(Long driverId);
}
