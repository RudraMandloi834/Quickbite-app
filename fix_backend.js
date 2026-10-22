const fs = require('fs');

// 1. Fix RestaurantService
let svc = fs.readFileSync('src/main/java/com/quickbite/restaurant/RestaurantService.java', 'utf8');
const methodStr = `    public Restaurant getRestaurantById(Long id) {
        return restaurantRepository.findById(id).orElse(null);
    }
`;
svc = svc.replace('public class RestaurantService {', 'public class RestaurantService {\n' + methodStr);
fs.writeFileSync('src/main/java/com/quickbite/restaurant/RestaurantService.java', svc);

// 2. Fix RestaurantController
let ctrl = fs.readFileSync('src/main/java/com/quickbite/restaurant/RestaurantController.java', 'utf8');
ctrl = ctrl.replace('Restaurant restaurant = restaurantRepository.findById(restaurantId).orElse(null);', 'Restaurant restaurant = restaurantService.getRestaurantById(restaurantId);');
fs.writeFileSync('src/main/java/com/quickbite/restaurant/RestaurantController.java', ctrl);

console.log('Fixed backend');
