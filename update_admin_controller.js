const fs = require('fs');

let controller = fs.readFileSync('src/main/java/com/quickbite/admin/AdminController.java', 'utf8');

const updatedMethods = `
    private RestaurantAdminDTO mapToDTO(Restaurant r) {
        Customer c = null;
        if (r.getOwnerId() != null) {
            c = customerRepository.findById(r.getOwnerId()).orElse(null);
        }
        return new RestaurantAdminDTO(r, c);
    }

    @GetMapping("/restaurants/pending")
    public List<RestaurantAdminDTO> getPendingRestaurants() {
        return restaurantRepository.findByStatus(RestaurantStatus.PENDING_APPROVAL).stream().map(this::mapToDTO).toList();
    }

    @GetMapping("/restaurants/approved")
    public List<RestaurantAdminDTO> getApprovedRestaurants() {
        return restaurantRepository.findByStatus(RestaurantStatus.APPROVED).stream().map(this::mapToDTO).toList();
    }

    @GetMapping("/restaurants/rejected")
    public List<RestaurantAdminDTO> getRejectedRestaurants() {
        return restaurantRepository.findByStatus(RestaurantStatus.REJECTED).stream().map(this::mapToDTO).toList();
    }

    @PutMapping("/restaurants/{id}/approve")
    public RestaurantAdminDTO approveRestaurant(@PathVariable Long id) {
        return mapToDTO(restaurantService.approveRestaurant(id));
    }

    @PutMapping("/restaurants/{id}/reject")
    public RestaurantAdminDTO rejectRestaurant(@PathVariable Long id) {
        return mapToDTO(restaurantService.rejectRestaurant(id));
    }
`;

controller = controller.replace(/@GetMapping\("\/restaurants\/pending"\)[\s\S]*?(?=\}$)/, updatedMethods);
fs.writeFileSync('src/main/java/com/quickbite/admin/AdminController.java', controller);
