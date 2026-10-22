import re

with open('src/main/java/com/quickbite/restaurant/RestaurantController.java', 'r') as f:
    content = f.read()

old_nearby = r"""@GetMapping\("/nearby"\)\s*public List<NearbyRestaurantProjection> getNearbyRestaurants\([\s\S]*?return restaurantService\.getNearbyRestaurants\(latitude, longitude, radiusKm\);\s*\}"""

new_nearby = """@GetMapping("/nearby")
    public ResponseEntity<Page<NearbyRestaurantProjection>> getNearbyRestaurants(
            @RequestParam(name = "latitude", required = false) Double latitude,
            @RequestParam(name = "longitude", required = false) Double longitude,
            @RequestParam(name = "radiusKm", required = false, defaultValue = "10.0") Double radiusKm,
            @PageableDefault(size = 16) Pageable pageable) {
        
        if (latitude == null || latitude < -90 || latitude > 90) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or missing latitude (-90 to 90)");
        }
        if (longitude == null || longitude < -180 || longitude > 180) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or missing longitude (-180 to 180)");
        }
        if (radiusKm == null || radiusKm <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or missing radiusKm (must be > 0)");
        }
        
        if (pageable.getPageSize() > 50) {
            pageable = org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(), 50, pageable.getSort());
        }
        
        return ResponseEntity.ok(restaurantService.getNearbyRestaurants(latitude, longitude, radiusKm, pageable));
    }"""

content = re.sub(old_nearby, new_nearby, content, flags=re.DOTALL)

with open('src/main/java/com/quickbite/restaurant/RestaurantController.java', 'w') as f:
    f.write(content)

