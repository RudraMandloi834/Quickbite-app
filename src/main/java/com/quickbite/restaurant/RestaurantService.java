package com.quickbite.restaurant;

import java.util.List;
import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.stereotype.Service;
import com.quickbite.event.SseService;
import com.quickbite.event.SystemEvent;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.quickbite.customer.Customer;
import com.quickbite.customer.CustomerRepository;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final RestaurantStaffProfileRepository staffProfileRepository;
    private final SseService sseService;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final RestaurantInvitationRepository invitationRepository;
    private final RestaurantJoinRequestRepository joinRequestRepository;

    public RestaurantService(RestaurantRepository restaurantRepository, 
                             RestaurantStaffProfileRepository staffProfileRepository,
                             CustomerRepository customerRepository,
                             RestaurantInvitationRepository invitationRepository,
                             RestaurantJoinRequestRepository joinRequestRepository,
                             PasswordEncoder passwordEncoder,
                             com.quickbite.event.SseService sseService) {
        this.restaurantRepository = restaurantRepository;
        this.staffProfileRepository = staffProfileRepository;
        this.sseService = sseService;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.invitationRepository = invitationRepository;
        this.joinRequestRepository = joinRequestRepository;
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
        if (restaurantRepository.existsByName(request.name())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Restaurant with this name already exists or is pending approval.");
        }
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

    private String generateRandomPassword() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[12];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public ApprovalResponse approveRestaurant(Long restaurantId, Long operatorId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
            .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Restaurant not found"));
        if (restaurant.getStatus() != RestaurantStatus.PENDING_APPROVAL) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "Restaurant is not pending approval");
        }
        restaurant.setStatus(RestaurantStatus.APPROVED);
        restaurant.setReviewedBy(operatorId);
        restaurant.setReviewedAt(java.time.Instant.now());
        restaurant = restaurantRepository.save(restaurant);

        // Generate credentials
        String rawPassword = generateRandomPassword();
        String username = "partner_" + restaurant.getId() + "@quickbite.com";
        
        Customer generatedAccount = new Customer(
            restaurant.getName() + " Manager",
            username,
            null,
            passwordEncoder.encode(rawPassword),
            "ROLE_CUSTOMER"
        );
        generatedAccount = customerRepository.save(generatedAccount);

        RestaurantStaffProfile staff = new RestaurantStaffProfile(generatedAccount.getId(), restaurant.getId());
        staff.setApprovalStatus(StaffRequestStatus.APPROVED);
        staffProfileRepository.save(staff);

                sseService.emitToRestaurant(restaurant.getOwnerId(), new SystemEvent(
            UUID.randomUUID().toString(), "RESTAURANT_APPROVED", null, restaurant.getId(), restaurant.getOwnerId(), null, "APPROVED"
        ));
        return new ApprovalResponse(restaurant, username, rawPassword);
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
        
        List<RestaurantJoinRequest> joinRequests = joinRequestRepository.findByRestaurantId(restaurantId);
        for (RestaurantJoinRequest req : joinRequests) {
            if (req.getUserId().equals(userId) && req.getStatus() == StaffRequestStatus.APPROVED) {
                return true;
            }
        }
        
        return false;
    }

    public RestaurantInvitation createInvitation(Long restaurantId, Long ownerId) {
        if (!hasRestaurantAccess(restaurantId, ownerId)) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Access denied");
        }
        String code = generateRandomPassword().substring(0, 8).toUpperCase();
        RestaurantInvitation inv = new RestaurantInvitation(restaurantId, code, ownerId);
        return invitationRepository.save(inv);
    }

    public RestaurantJoinRequest joinWithCode(String code, Long userId) {
        RestaurantInvitation inv = invitationRepository.findByCode(code)
            .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Invalid invitation code"));
        
        RestaurantJoinRequest req = joinRequestRepository.findByRestaurantIdAndUserId(inv.getRestaurantId(), userId).orElse(null);
        if (req != null) {
            if (req.getStatus() == StaffRequestStatus.PENDING_APPROVAL) {
                throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "Join request already pending");
            }
            if (req.getStatus() == StaffRequestStatus.APPROVED) {
                throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "Already joined");
            }
            req.setStatus(StaffRequestStatus.PENDING_APPROVAL);
            return joinRequestRepository.save(req);
        }
        
        return joinRequestRepository.save(new RestaurantJoinRequest(inv.getRestaurantId(), userId));
    }

    public List<RestaurantJoinRequest> getJoinRequests(Long restaurantId, Long ownerId) {
        if (!hasRestaurantAccess(restaurantId, ownerId)) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Access denied");
        }
        return joinRequestRepository.findByRestaurantId(restaurantId);
    }
    
    public List<RestaurantJoinRequest> getMyJoinRequests(Long userId) {
        return joinRequestRepository.findByUserId(userId);
    }

    public RestaurantJoinRequest approveJoinRequest(Long requestId, Long ownerId) {
        RestaurantJoinRequest req = joinRequestRepository.findById(requestId)
            .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Request not found"));
        if (!hasRestaurantAccess(req.getRestaurantId(), ownerId)) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Access denied");
        }
        req.setStatus(StaffRequestStatus.APPROVED);
        RestaurantJoinRequest saved = joinRequestRepository.save(req);
        sseService.emitToRestaurant(saved.getUserId(), new SystemEvent(
            UUID.randomUUID().toString(), "JOIN_REQUEST_APPROVED", null, saved.getRestaurantId(), saved.getUserId(), null, "APPROVED"
        ));
        return saved;
    }

    public RestaurantJoinRequest rejectJoinRequest(Long requestId, Long ownerId) {
        RestaurantJoinRequest req = joinRequestRepository.findById(requestId)
            .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Request not found"));
        if (!hasRestaurantAccess(req.getRestaurantId(), ownerId)) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Access denied");
        }
        req.setStatus(StaffRequestStatus.REJECTED);
        return joinRequestRepository.save(req);
    }
}
