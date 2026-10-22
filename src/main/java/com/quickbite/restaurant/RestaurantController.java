package com.quickbite.restaurant;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {
    @GetMapping("/{restaurantId}")
    public Restaurant getRestaurantById(@PathVariable Long restaurantId) {
        Restaurant restaurant = restaurantService.getRestaurantById(restaurantId);
        if (restaurant == null || (restaurant.getStatus() != null && restaurant.getStatus() != RestaurantStatus.APPROVED)) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Restaurant not found");
        }
        return restaurant;
    }


    private final RestaurantService restaurantService;

    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    
    @GetMapping("/cities")
    public List<String> getCities() {
        return restaurantService.getDistinctCities();
    }

    @GetMapping
    public Page<Restaurant> searchRestaurants(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "16") int size,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String locality,
            @RequestParam(required = false) String cuisine,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Integer priceRange,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "rating,desc") String[] sort) {
        
        // Enforce safe maximum page size
        int safeSize = Math.min(size, 50);
        
        Sort.Direction direction = Sort.Direction.DESC;
        String property = "rating";
        
        if (sort != null && sort.length > 0) {
            if (sort.length == 2) {
                property = sort[0];
                direction = Sort.Direction.fromString(sort[1]);
            } else if (sort.length == 1) {
                // If it's comma separated in a single string (e.g. ?sort=rating,desc)
                String[] parts = sort[0].split(",");
                if (parts.length == 2) {
                    property = parts[0];
                    direction = Sort.Direction.fromString(parts[1]);
                } else {
                    property = sort[0];
                }
            }
        }
        
        PageRequest pageRequest = PageRequest.of(page, safeSize, Sort.by(direction, property));
        return restaurantService.searchRestaurants(city, locality, cuisine, minRating, priceRange, search, pageRequest);
    }


    @GetMapping("/nearby")
    public Page<NearbyRestaurantProjection> getNearbyRestaurants(
            @RequestParam(name = "latitude", required = false) Double latitude,
            @RequestParam(name = "longitude", required = false) Double longitude,
            @RequestParam(name = "radiusKm", required = false) Double radiusKm,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "16") int size) {
        
        if (latitude == null || latitude < -90 || latitude > 90) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or missing latitude (-90 to 90)");
        }
        if (longitude == null || longitude < -180 || longitude > 180) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or missing longitude (-180 to 180)");
        }
        if (radiusKm == null || radiusKm <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or missing radiusKm (must be > 0)");
        }
        
        int safeSize = Math.min(size, 16); // Maximum 16 results as per requirements
        
        return restaurantService.getNearbyRestaurants(latitude, longitude, radiusKm, PageRequest.of(page, safeSize));
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


    @PostMapping("/{restaurantId}/invitations")
    @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.CREATED)
    public RestaurantInvitation createInvitation(@org.springframework.web.bind.annotation.PathVariable Long restaurantId) {
        Long authenticatedUserId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        return restaurantService.createInvitation(restaurantId, authenticatedUserId);
    }

    @PostMapping("/join-with-code")
    @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.CREATED)
    public RestaurantJoinRequest joinWithCode(@RequestBody JoinCodeRequest request) {
        Long authenticatedUserId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        return restaurantService.joinWithCode(request.code(), authenticatedUserId);
    }
    
    @GetMapping("/{restaurantId}/join-requests")
    public List<RestaurantJoinRequest> getJoinRequests(@org.springframework.web.bind.annotation.PathVariable Long restaurantId) {
        Long authenticatedUserId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        return restaurantService.getJoinRequests(restaurantId, authenticatedUserId);
    }

    @GetMapping("/my-join-requests")
    public List<RestaurantJoinRequest> getMyJoinRequests() {
        Long authenticatedUserId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        return restaurantService.getMyJoinRequests(authenticatedUserId);
    }

    @PostMapping("/join-requests/{requestId}/approve")
    public RestaurantJoinRequest approveJoinRequest(@org.springframework.web.bind.annotation.PathVariable Long requestId) {
        Long authenticatedUserId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        return restaurantService.approveJoinRequest(requestId, authenticatedUserId);
    }

    @PostMapping("/join-requests/{requestId}/reject")
    public RestaurantJoinRequest rejectJoinRequest(@org.springframework.web.bind.annotation.PathVariable Long requestId) {
        Long authenticatedUserId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        return restaurantService.rejectJoinRequest(requestId, authenticatedUserId);
    }
}

record JoinCodeRequest(String code) {}
