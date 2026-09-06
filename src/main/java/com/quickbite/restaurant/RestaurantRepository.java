package com.quickbite.restaurant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    @Query(value = "SELECT id, name, cuisine, location, rating, address, city, area, latitude, longitude, opening_hours AS openingHours, delivery_radius AS deliveryRadius, cover_image_url AS coverImageUrl, " +
           "(6371 * acos(cos(radians(:latitude)) * cos(radians(latitude)) * cos(radians(longitude) - radians(:longitude)) + sin(radians(:latitude)) * sin(radians(latitude)))) AS distanceKm " +
           "FROM restaurant " +
           "WHERE latitude IS NOT NULL AND longitude IS NOT NULL " +
           "AND latitude BETWEEN :minLat AND :maxLat " +
           "AND longitude BETWEEN :minLon AND :maxLon " +
           "AND (6371 * acos(cos(radians(:latitude)) * cos(radians(latitude)) * cos(radians(longitude) - radians(:longitude)) + sin(radians(:latitude)) * sin(radians(latitude)))) <= :radiusKm " +
           "ORDER BY distanceKm ASC", nativeQuery = true)
    List<NearbyRestaurantProjection> findNearbyRestaurants(
            @Param("latitude") double latitude, 
            @Param("longitude") double longitude, 
            @Param("radiusKm") double radiusKm,
            @Param("minLat") double minLat,
            @Param("maxLat") double maxLat,
            @Param("minLon") double minLon,
            @Param("maxLon") double maxLon);
}
