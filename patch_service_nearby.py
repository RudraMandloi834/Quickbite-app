import re

with open('src/main/java/com/quickbite/restaurant/RestaurantService.java', 'r') as f:
    content = f.read()

content = content.replace(
    'public List<NearbyRestaurantProjection> getNearbyRestaurants(double latitude, double longitude, double radiusKm) {',
    'public Page<NearbyRestaurantProjection> getNearbyRestaurants(double latitude, double longitude, double radiusKm, Pageable pageable) {'
)
content = content.replace(
    'return restaurantRepository.findNearbyRestaurants(latitude, longitude, radiusKm, minLat, maxLat, minLon, maxLon);',
    'return restaurantRepository.findNearbyRestaurants(latitude, longitude, radiusKm, minLat, maxLat, minLon, maxLon, pageable);'
)

with open('src/main/java/com/quickbite/restaurant/RestaurantService.java', 'w') as f:
    f.write(content)

