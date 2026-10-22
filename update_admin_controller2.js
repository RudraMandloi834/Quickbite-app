const fs = require('fs');

let controller = fs.readFileSync('src/main/java/com/quickbite/admin/AdminController.java', 'utf8');

controller = controller.replace(
  'public RestaurantAdminDTO approveRestaurant(@PathVariable Long id) {\n        return mapToDTO(restaurantService.approveRestaurant(id));\n    }',
  `public RestaurantAdminDTO approveRestaurant(@PathVariable Long id) {
        Long operatorId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        return mapToDTO(restaurantService.approveRestaurantAdmin(id, operatorId));
    }`
);

controller = controller.replace(
  'public RestaurantAdminDTO rejectRestaurant(@PathVariable Long id) {\n        return mapToDTO(restaurantService.rejectRestaurant(id));\n    }',
  `public RestaurantAdminDTO rejectRestaurant(@PathVariable Long id, @RequestBody(required=false) java.util.Map<String, String> body) {
        Long operatorId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        String reason = body != null ? body.get("reason") : "";
        return mapToDTO(restaurantService.rejectRestaurantAdmin(id, operatorId, reason));
    }`
);

fs.writeFileSync('src/main/java/com/quickbite/admin/AdminController.java', controller);
