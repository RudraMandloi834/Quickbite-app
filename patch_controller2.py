with open("src/main/java/com/quickbite/restaurant/RestaurantController.java", "r") as f: content = f.read()

new_get = """    @GetMapping("/{id}")
    public ResponseEntity<Restaurant> getRestaurantById(@org.springframework.web.bind.annotation.PathVariable Long id) {
        return restaurantService.getRestaurantById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
"""

content = content.replace("public ResponseEntity<Page<Restaurant>> getAllRestaurants(", new_get + "\n    public ResponseEntity<Page<Restaurant>> getAllRestaurants(")

with open("src/main/java/com/quickbite/restaurant/RestaurantController.java", "w") as f: f.write(content)

with open("src/main/java/com/quickbite/restaurant/RestaurantService.java", "r") as f: content2 = f.read()

new_svc = """    public java.util.Optional<Restaurant> getRestaurantById(Long id) {
        return restaurantRepository.findById(id);
    }
"""
content2 = content2.replace("public Page<Restaurant> getRestaurantsPaginated(", new_svc + "\n    public Page<Restaurant> getRestaurantsPaginated(")

with open("src/main/java/com/quickbite/restaurant/RestaurantService.java", "w") as f: f.write(content2)

