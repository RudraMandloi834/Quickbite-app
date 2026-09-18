package com.quickbite.restaurant;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RestaurantJoinRequestRepository extends JpaRepository<RestaurantJoinRequest, Long> {
    List<RestaurantJoinRequest> findByUserId(Long userId);
    List<RestaurantJoinRequest> findByRestaurantId(Long restaurantId);
    Optional<RestaurantJoinRequest> findByRestaurantIdAndUserId(Long restaurantId, Long userId);
}
