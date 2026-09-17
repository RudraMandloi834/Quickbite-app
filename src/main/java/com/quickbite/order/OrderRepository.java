package com.quickbite.order;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<Order> findTop50ByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);
}
