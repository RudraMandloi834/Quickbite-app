const fs = require('fs');
let controller = fs.readFileSync('src/main/java/com/quickbite/restaurant/RestaurantController.java', 'utf8');
controller = controller.replace('@GetMapping\n    \n    @GetMapping("/cities")', '@GetMapping("/cities")');
fs.writeFileSync('src/main/java/com/quickbite/restaurant/RestaurantController.java', controller);
