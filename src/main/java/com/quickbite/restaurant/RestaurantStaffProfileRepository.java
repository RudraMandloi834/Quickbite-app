package com.quickbite.restaurant;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RestaurantStaffProfileRepository extends JpaRepository<RestaurantStaffProfile, Long> {
    List<RestaurantStaffProfile> findByUserId(Long userId);
    List<RestaurantStaffProfile> findByRestaurantId(Long restaurantId);
    List<RestaurantStaffProfile> findByUserIdAndRestaurantId(Long userId, Long restaurantId);
}
