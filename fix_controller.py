with open("src/main/java/com/quickbite/restaurant/RestaurantController.java", "r") as f: content = f.read()

bad = """    @GetMapping
        @GetMapping("/{id}")
    public ResponseEntity<Restaurant> getRestaurantById(@org.springframework.web.bind.annotation.PathVariable Long id) {
        return restaurantService.getRestaurantById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    public ResponseEntity<Page<Restaurant>> getAllRestaurants("""

good = """    @GetMapping("/{id}")
    public ResponseEntity<Restaurant> getRestaurantById(@org.springframework.web.bind.annotation.PathVariable Long id) {
        return restaurantService.getRestaurantById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<Page<Restaurant>> getAllRestaurants("""

content = content.replace(bad, good)
with open("src/main/java/com/quickbite/restaurant/RestaurantController.java", "w") as f: f.write(content)
