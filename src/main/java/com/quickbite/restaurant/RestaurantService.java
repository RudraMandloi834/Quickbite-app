package com.quickbite.restaurant;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final RestaurantStaffProfileRepository staffProfileRepository;

    public RestaurantService(RestaurantRepository restaurantRepository, RestaurantStaffProfileRepository staffProfileRepository) {
        this.restaurantRepository = restaurantRepository;
        this.staffProfileRepository = staffProfileRepository;
    }

    public List<Restaurant> getAllRestaurants() {
        return restaurantRepository.findApprovedRestaurants();
    }

    public Restaurant createRestaurant(CreateRestaurantRequest request) {
        Restaurant restaurant = new Restaurant(
                request.name(),
                request.cuisine(),
                request.location(),
                request.rating() != null ? request.rating() : 0.0,
                request.address(),
                request.city(),
                request.area(),
                request.latitude(),
                request.longitude(),
                request.openingHours(),
                request.deliveryRadius(),
                request.coverImageUrl()
        );
        restaurant.setStatus(RestaurantStatus.APPROVED);
        return restaurantRepository.save(restaurant);
    }

    public Restaurant applyForRestaurant(CreateRestaurantRequest request, Long ownerId) {
        Restaurant restaurant = new Restaurant(
                request.name(),
                request.cuisine(),
                request.location(),
                request.rating() != null ? request.rating() : 0.0,
                request.address(),
                request.city(),
                request.area(),
                request.latitude(),
                request.longitude(),
                request.openingHours(),
                request.deliveryRadius(),
                request.coverImageUrl()
        );
        restaurant.setStatus(RestaurantStatus.PENDING_APPROVAL);
        restaurant.setOwnerId(ownerId);
        return restaurantRepository.save(restaurant);
    }

    public List<Restaurant> getMyApplications(Long ownerId) {
        return restaurantRepository.findByOwnerId(ownerId);
    }

    public RestaurantStaffProfile applyForStaff(Long restaurantId, Long userId) {
        restaurantRepository.findById(restaurantId)
            .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Restaurant not found"));

        List<RestaurantStaffProfile> existingProfiles = staffProfileRepository.findByUserIdAndRestaurantId(userId, restaurantId);
        for (RestaurantStaffProfile profile : existingProfiles) {
            if (profile.getApprovalStatus() == StaffRequestStatus.PENDING_APPROVAL) {
                throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "Duplicate pending staff request");
            }
        }

        RestaurantStaffProfile profile = new RestaurantStaffProfile(userId, restaurantId);
        return staffProfileRepository.save(profile);
    }

    public List<RestaurantStaffProfile> getMyStaffRequests(Long userId) {
        return staffProfileRepository.findByUserId(userId);
    }

    public List<NearbyRestaurantProjection> getNearbyRestaurants(double latitude, double longitude, double radiusKm) {
        double latDelta = radiusKm / 111.0;
        double lonDelta = radiusKm / (111.0 * Math.cos(Math.toRadians(latitude)));

        double minLat = latitude - latDelta;
        double maxLat = latitude + latDelta;
        double minLon = longitude - lonDelta;
        double maxLon = longitude + lonDelta;

        return restaurantRepository.findNearbyRestaurants(latitude, longitude, radiusKm, minLat, maxLat, minLon, maxLon);
    }

    public List<Restaurant> getPendingRestaurants() {
        return restaurantRepository.findByStatus(RestaurantStatus.PENDING_APPROVAL);
    }

    public Restaurant approveRestaurant(Long restaurantId, Long operatorId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
            .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Restaurant not found"));
        if (restaurant.getStatus() != RestaurantStatus.PENDING_APPROVAL) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "Restaurant is not pending approval");
        }
        restaurant.setStatus(RestaurantStatus.APPROVED);
        restaurant.setReviewedBy(operatorId);
        restaurant.setReviewedAt(java.time.Instant.now());
        return restaurantRepository.save(restaurant);
    }

    public Restaurant rejectRestaurant(Long restaurantId, Long operatorId, String reason) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
            .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Restaurant not found"));
        if (restaurant.getStatus() != RestaurantStatus.PENDING_APPROVAL) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "Restaurant is not pending approval");
        }
        restaurant.setStatus(RestaurantStatus.REJECTED);
        restaurant.setReviewedBy(operatorId);
        restaurant.setReviewedAt(java.time.Instant.now());
        restaurant.setRejectionReason(reason);
        return restaurantRepository.save(restaurant);
    }

    public boolean hasRestaurantAccess(Long restaurantId, Long userId) {
        if (restaurantId == null || userId == null) return false;
        Restaurant restaurant = restaurantRepository.findById(restaurantId).orElse(null);
        if (restaurant == null) return false;
        if (restaurant.getOwnerId() != null && restaurant.getOwnerId().equals(userId)) return true;

        List<RestaurantStaffProfile> profiles = staffProfileRepository.findByUserIdAndRestaurantId(userId, restaurantId);
        for (RestaurantStaffProfile profile : profiles) {
            if (profile.getApprovalStatus() == StaffRequestStatus.APPROVED) {
                return true;
            }
        }
        return false;
    }
}
