package com.quickbite.restaurant;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.quickbite.security.SecurityUtils;
import java.util.List;

@RestController
@RequestMapping("/api/operator/restaurants")
@PreAuthorize("hasRole('OPERATOR')")
public class OperatorRestaurantController {

    private final RestaurantService restaurantService;

    public OperatorRestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @GetMapping("/pending")
    public List<Restaurant> getPendingRestaurants() {
        return restaurantService.getPendingRestaurants();
    }

    @PostMapping("/{restaurantId}/approve")
    public Restaurant approveRestaurant(@PathVariable Long restaurantId) {
        Long operatorId = SecurityUtils.getAuthenticatedCustomerId();
        return restaurantService.approveRestaurant(restaurantId, operatorId);
    }

    @PostMapping("/{restaurantId}/reject")
    public Restaurant rejectRestaurant(
            @PathVariable Long restaurantId,
            @RequestBody(required = false) RejectRequest request) {
        Long operatorId = SecurityUtils.getAuthenticatedCustomerId();
        String reason = (request != null) ? request.reason() : null;
        if (reason == null || reason.trim().isEmpty()) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Rejection reason is required");
        }
        return restaurantService.rejectRestaurant(restaurantId, operatorId, reason);
    }

    public record RejectRequest(String reason) {}
}
