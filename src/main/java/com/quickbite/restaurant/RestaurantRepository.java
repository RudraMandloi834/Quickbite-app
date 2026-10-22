package com.quickbite.restaurant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Restaurant> {

    @Query("SELECT r FROM Restaurant r WHERE r.status IS NULL OR r.status = 'APPROVED'")
    List<Restaurant> findApprovedRestaurants();

    List<Restaurant> findByOwnerId(Long ownerId);
    boolean existsByName(String name);
    boolean existsByNameAndOwnerId(String name, Long ownerId);
    List<Restaurant> findByStatus(RestaurantStatus status);
    @Query("SELECT DISTINCT r.city FROM Restaurant r WHERE r.city IS NOT NULL AND (r.status IS NULL OR r.status = 'APPROVED') ORDER BY r.city ASC")
    List<String> findDistinctCities();


        @Query(value = "SELECT id, name, cuisine, location, rating, address, city, area, latitude, longitude, opening_hours AS openingHours, delivery_radius AS deliveryRadius, cover_image_url AS coverImageUrl, " +
           "(6371 * acos(cos(radians(:latitude)) * cos(radians(latitude)) * cos(radians(longitude) - radians(:longitude)) + sin(radians(:latitude)) * sin(radians(latitude)))) AS distanceKm " +
           "FROM restaurant " +
           "WHERE latitude IS NOT NULL AND longitude IS NOT NULL " +
           "AND (status IS NULL OR status = 'APPROVED') " +
           "AND latitude BETWEEN :minLat AND :maxLat " +
           "AND longitude BETWEEN :minLon AND :maxLon " +
           "AND (6371 * acos(cos(radians(:latitude)) * cos(radians(latitude)) * cos(radians(longitude) - radians(:longitude)) + sin(radians(:latitude)) * sin(radians(latitude)))) <= :radiusKm " +
           "ORDER BY distanceKm ASC", 
           countQuery = "SELECT count(*) FROM restaurant " +
           "WHERE latitude IS NOT NULL AND longitude IS NOT NULL " +
           "AND (status IS NULL OR status = 'APPROVED') " +
           "AND latitude BETWEEN :minLat AND :maxLat " +
           "AND longitude BETWEEN :minLon AND :maxLon " +
           "AND (6371 * acos(cos(radians(:latitude)) * cos(radians(latitude)) * cos(radians(longitude) - radians(:longitude)) + sin(radians(:latitude)) * sin(radians(latitude)))) <= :radiusKm",
           nativeQuery = true)
    org.springframework.data.domain.Page<NearbyRestaurantProjection> findNearbyRestaurants(
            @Param("latitude") double latitude, 
            @Param("longitude") double longitude, 
            @Param("radiusKm") double radiusKm,
            @Param("minLat") double minLat,
            @Param("maxLat") double maxLat,
            @Param("minLon") double minLon,
            @Param("maxLon") double maxLon,
            org.springframework.data.domain.Pageable pageable);
}
