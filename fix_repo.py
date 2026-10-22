with open("src/main/java/com/quickbite/restaurant/RestaurantRepository.java", "r") as f:
    content = f.read()

bad = """    @Query("SELECT r FROM Restaurant r WHERE r.status IS NULL OR r.status = 'APPROVED'")
    Page<Restaurant> findByStatus(RestaurantStatus status, Pageable pageable);
    List<Restaurant> findApprovedRestaurants();"""

good = """    @Query("SELECT r FROM Restaurant r WHERE r.status IS NULL OR r.status = 'APPROVED'")
    List<Restaurant> findApprovedRestaurants();"""

content = content.replace(bad, good)
with open("src/main/java/com/quickbite/restaurant/RestaurantRepository.java", "w") as f:
    f.write(content)

