import re

with open('src/main/java/com/quickbite/restaurant/RestaurantRepository.java', 'r') as f:
    content = f.read()

old_query = r"""@Query\(value = "SELECT.*?List<NearbyRestaurantProjection> findNearbyRestaurants\([\s\S]*?\);"""

new_query = """@Query(value = "SELECT id, name, cuisine, location, rating, address, city, area, latitude, longitude, opening_hours AS openingHours, delivery_radius AS deliveryRadius, cover_image_url AS coverImageUrl, review_count AS reviewCount, price_range AS priceRange, delivery_availability AS deliveryAvailability, " +
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
    Page<NearbyRestaurantProjection> findNearbyRestaurants(
            @Param("latitude") double latitude, 
            @Param("longitude") double longitude, 
            @Param("radiusKm") double radiusKm,
            @Param("minLat") double minLat,
            @Param("maxLat") double maxLat,
            @Param("minLon") double minLon,
            @Param("maxLon") double maxLon,
            Pageable pageable);"""

content = re.sub(old_query, new_query, content, flags=re.DOTALL)

with open('src/main/java/com/quickbite/restaurant/RestaurantRepository.java', 'w') as f:
    f.write(content)
