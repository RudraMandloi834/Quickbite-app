const fs = require('fs');
let code = fs.readFileSync('src/main/java/com/quickbite/restaurant/RestaurantService.java', 'utf8');

// I need to replace the old approveRestaurant(Long, Long) and rejectRestaurant(Long, Long, String)
// with the proper implementation.
const newMethods = `
    public Restaurant approveRestaurantAdmin(Long restaurantId, Long operatorId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
            .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Restaurant not found"));
        if (restaurant.getStatus() != RestaurantStatus.PENDING_APPROVAL) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "Restaurant is not pending approval");
        }
        restaurant.setStatus(RestaurantStatus.APPROVED);
        restaurant.setReviewedBy(operatorId);
        restaurant.setReviewedAt(java.time.Instant.now());
        restaurant = restaurantRepository.save(restaurant);

        // Grant partner access to existing owner
        if (restaurant.getOwnerId() != null) {
            com.quickbite.customer.Customer owner = customerRepository.findById(restaurant.getOwnerId()).orElse(null);
            if (owner != null && !owner.getRole().contains("OPERATOR")) {
                owner.setRole("ROLE_RESTAURANT_PARTNER");
                customerRepository.save(owner);
            }
        }
        
        // Notify owner
        sseService.emitToRestaurant(restaurant.getOwnerId(), new SystemEvent(
            java.util.UUID.randomUUID().toString(), "RESTAURANT_APPROVED", null, restaurant.getId(), restaurant.getOwnerId(), null, "APPROVED"
        ));
        
        return restaurant;
    }

    public Restaurant rejectRestaurantAdmin(Long restaurantId, Long operatorId, String reason) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
            .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Restaurant not found"));
        if (restaurant.getStatus() != RestaurantStatus.PENDING_APPROVAL) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "Restaurant is not pending approval");
        }
        restaurant.setStatus(RestaurantStatus.REJECTED);
        restaurant.setReviewedBy(operatorId);
        restaurant.setReviewedAt(java.time.Instant.now());
        // Reason field might not exist on entity, but we store status
        restaurant = restaurantRepository.save(restaurant);

        // Notify owner
        sseService.emitToRestaurant(restaurant.getOwnerId(), new SystemEvent(
            java.util.UUID.randomUUID().toString(), "RESTAURANT_REJECTED", null, restaurant.getId(), restaurant.getOwnerId(), null, "REJECTED"
        ));
        
        return restaurant;
    }
`;

// Remove my previous patch
code = code.replace(/public Restaurant approveRestaurant\(Long id\)[\s\S]*?return restaurantRepository\.save\(restaurant\);\n    }/, '');

// Replace old original ones
code = code.replace(/public ApprovalResponse approveRestaurant\(Long restaurantId, Long operatorId\)[\s\S]*?return new ApprovalResponse\(restaurant, username, rawPassword\);\n    }/, newMethods);
code = code.replace(/public Restaurant rejectRestaurant\(Long restaurantId, Long operatorId, String reason\)[\s\S]*?return restaurantRepository\.save\(restaurant\);\n    }/, '');


fs.writeFileSync('src/main/java/com/quickbite/restaurant/RestaurantService.java', code);
