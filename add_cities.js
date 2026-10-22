const fs = require('fs');

// 1. RestaurantRepository.java
let repo = fs.readFileSync('src/main/java/com/quickbite/restaurant/RestaurantRepository.java', 'utf8');
const repoMethod = `
    @Query("SELECT DISTINCT r.city FROM Restaurant r WHERE r.city IS NOT NULL AND (r.status IS NULL OR r.status = 'APPROVED') ORDER BY r.city ASC")
    List<String> findDistinctCities();
`;
repo = repo.replace('List<Restaurant> findByStatus(RestaurantStatus status);', 'List<Restaurant> findByStatus(RestaurantStatus status);' + repoMethod);
fs.writeFileSync('src/main/java/com/quickbite/restaurant/RestaurantRepository.java', repo);

// 2. RestaurantService.java
let service = fs.readFileSync('src/main/java/com/quickbite/restaurant/RestaurantService.java', 'utf8');
const serviceMethod = `
    public List<String> getDistinctCities() {
        return restaurantRepository.findDistinctCities();
    }
`;
service = service.replace('public Page<Restaurant> searchRestaurants', serviceMethod + '\n    public Page<Restaurant> searchRestaurants');
fs.writeFileSync('src/main/java/com/quickbite/restaurant/RestaurantService.java', service);

// 3. RestaurantController.java
let controller = fs.readFileSync('src/main/java/com/quickbite/restaurant/RestaurantController.java', 'utf8');
const controllerMethod = `
    @GetMapping("/cities")
    public List<String> getCities() {
        return restaurantService.getDistinctCities();
    }
`;
controller = controller.replace('public Page<Restaurant> searchRestaurants', controllerMethod + '\n    @GetMapping\n    public Page<Restaurant> searchRestaurants');
fs.writeFileSync('src/main/java/com/quickbite/restaurant/RestaurantController.java', controller);
