package com.quickbite.restaurant;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;

    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @GetMapping
    public List<Restaurant> getAllRestaurants() {
        return restaurantService.getAllRestaurants();
    }

    @GetMapping("/nearby")
    public List<NearbyRestaurantProjection> getNearbyRestaurants(
            @RequestParam(name = "latitude", required = false) Double latitude,
            @RequestParam(name = "longitude", required = false) Double longitude,
            @RequestParam(name = "radiusKm", required = false) Double radiusKm) {
        
        if (latitude == null || latitude < -90 || latitude > 90) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or missing latitude (-90 to 90)");
        }
        if (longitude == null || longitude < -180 || longitude > 180) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or missing longitude (-180 to 180)");
        }
        if (radiusKm == null || radiusKm <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or missing radiusKm (must be > 0)");
        }
        
        return restaurantService.getNearbyRestaurants(latitude, longitude, radiusKm);
    }

    @PostMapping
    @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.CREATED)
    public Restaurant createRestaurant(@RequestBody CreateRestaurantRequest request) {
        validate(request);
        return restaurantService.createRestaurant(request);
    }

    @PostMapping("/apply")
    @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.CREATED)
    public Restaurant applyForRestaurant(@RequestBody CreateRestaurantRequest request) {
        validate(request);
        Long authenticatedUserId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        if (authenticatedUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Must be logged in to apply");
        }
        return restaurantService.applyForRestaurant(request, authenticatedUserId);
    }

    @GetMapping("/my-applications")
    public List<Restaurant> getMyApplications() {
        Long authenticatedUserId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        if (authenticatedUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Must be logged in");
        }
        return restaurantService.getMyApplications(authenticatedUserId);
    }

    @PostMapping("/{restaurantId}/staff-requests")
    @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.CREATED)
    public RestaurantStaffProfile requestStaffAccess(@org.springframework.web.bind.annotation.PathVariable Long restaurantId) {
        Long authenticatedUserId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        if (authenticatedUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Must be logged in to apply");
        }
        return restaurantService.applyForStaff(restaurantId, authenticatedUserId);
    }

    @GetMapping("/my-staff-requests")
    public List<RestaurantStaffProfile> getMyStaffRequests() {
        Long authenticatedUserId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        if (authenticatedUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Must be logged in");
        }
        return restaurantService.getMyStaffRequests(authenticatedUserId);
    }

    private void validate(CreateRestaurantRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name must not be blank");
        }
        if (request.cuisine() == null || request.cuisine().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cuisine must not be blank");
        }
        if (request.location() == null || request.location().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location must not be blank");
        }
        if (request.rating() == null || request.rating() < 0 || request.rating() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating must be between 0 and 5");
        }
    }
}
