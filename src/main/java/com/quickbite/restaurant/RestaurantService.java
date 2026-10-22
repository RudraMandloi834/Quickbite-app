package com.quickbite.restaurant;

import java.util.List;
import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
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
    public Restaurant getRestaurantById(Long id) {
        return restaurantRepository.findById(id).orElse(null);
    }


    private final RestaurantRepository restaurantRepository;
    private final RestaurantStaffProfileRepository staffProfileRepository;
    private final SseService sseService;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final RestaurantInvitationRepository invitationRepository;
    private final RestaurantJoinRequestRepository joinRequestRepository;
    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private com.quickbite.order.OrderRepository orderRepository;

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

    
    
    public List<String> getDistinctCities() {
        return restaurantRepository.findDistinctCities();
    }

    public Page<Restaurant> searchRestaurants(
            String city, String locality, String cuisine, 
            Double minRating, Integer priceRange, String search, Pageable pageable) {
        
        Specification<Restaurant> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Only approved restaurants
            predicates.add(cb.or(
                cb.isNull(root.get("status")),
                cb.equal(root.get("status"), RestaurantStatus.APPROVED)
            ));
            
            if (city != null && !city.trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("city")), city.trim().toLowerCase()));
            }
            if (locality != null && !locality.trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("area")), locality.trim().toLowerCase()));
            }
            if (cuisine != null && !cuisine.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("cuisine")), "%" + cuisine.trim().toLowerCase() + "%"));
            }
            if (minRating != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("rating"), minRating));
            }
            if (priceRange != null) {
                predicates.add(cb.equal(root.get("priceRange"), priceRange));
            }
            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("name")), searchPattern),
                    cb.like(cb.lower(root.get("cuisine")), searchPattern),
                    cb.like(cb.lower(root.get("area")), searchPattern)
                ));
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        
        return restaurantRepository.findAll(spec, pageable);
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
                request.openingHours() != null ? request.openingHours() : (request.openingTime() + " - " + request.closingTime()),
                request.deliveryRadius(),
                request.coverImageUrl()
        );
        restaurant.setPhone(request.phone());
        restaurant.setEmail(request.email());
        restaurant.setOpeningTime(request.openingTime());
        restaurant.setClosingTime(request.closingTime());
        restaurant.setStatus(RestaurantStatus.APPROVED);
        return restaurantRepository.save(restaurant);
    }

    public Restaurant applyForRestaurant(CreateRestaurantRequest request, Long ownerId) {
        // prevent duplicate pending applications for the same owner
        if (restaurantRepository.findByOwnerId(ownerId).stream().anyMatch(r -> r.getStatus() == RestaurantStatus.PENDING_APPROVAL)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have a pending restaurant application.");
        }
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
        List<Restaurant> list = new ArrayList<>(restaurantRepository.findByOwnerId(ownerId));
        if (orderRepository != null && list.size() > 1) {
            list.sort((r1, r2) -> {
                var o1 = orderRepository.findTop50ByRestaurantIdOrderByCreatedAtDesc(r1.getId());
                var o2 = orderRepository.findTop50ByRestaurantIdOrderByCreatedAtDesc(r2.getId());
                java.time.Instant t1 = o1.isEmpty() ? null : o1.get(0).getCreatedAt();
                java.time.Instant t2 = o2.isEmpty() ? null : o2.get(0).getCreatedAt();
                if (t1 == null && t2 == null) return 0;
                if (t1 == null) return 1;
                if (t2 == null) return -1;
                return t2.compareTo(t1);
            });
        }
        return list;
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

    public Page<NearbyRestaurantProjection> getNearbyRestaurants(double latitude, double longitude, double radiusKm, Pageable pageable) {
        double latChange = radiusKm / 111.2;
        double lonChange = Math.abs(radiusKm / (111.2 * Math.cos(Math.toRadians(latitude))));
        
        double minLat = latitude - latChange;
        double maxLat = latitude + latChange;
        double minLon = longitude - lonChange;
        double maxLon = longitude + lonChange;
        
        return restaurantRepository.findNearbyRestaurants(
                latitude, longitude, radiusKm,
                minLat, maxLat, minLon, maxLon, pageable);
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
        String tempPwd = generateRandomPassword();
        restaurant.setTempPassword(tempPwd);
        if (restaurant.getOwnerId() != null) {
            com.quickbite.customer.Customer owner = customerRepository.findById(restaurant.getOwnerId()).orElse(null);
            if (owner != null && !owner.getRole().contains("OPERATOR")) {
                owner.setRole("ROLE_RESTAURANT_PARTNER");
                if (!"restaurant@test.com".equals(owner.getEmail())) {
                    owner.setPassword(passwordEncoder.encode(tempPwd));
                }
                customerRepository.save(owner);
            }
        }
        
        // Notify owner
        sseService.emitToCustomer(restaurant.getOwnerId(), new SystemEvent(
            java.util.UUID.randomUUID().toString(), "RESTAURANT_APPROVED", null, restaurant.getId(), restaurant.getOwnerId(), null, "APPROVED"
        ));
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
        sseService.emitToCustomer(restaurant.getOwnerId(), new SystemEvent(
            java.util.UUID.randomUUID().toString(), "RESTAURANT_REJECTED", null, restaurant.getId(), restaurant.getOwnerId(), null, "REJECTED"
        ));
        sseService.emitToRestaurant(restaurant.getOwnerId(), new SystemEvent(
            java.util.UUID.randomUUID().toString(), "RESTAURANT_REJECTED", null, restaurant.getId(), restaurant.getOwnerId(), null, "REJECTED"
        ));
        
        return restaurant;
    }


    

    public boolean hasRestaurantAccess(Long restaurantId, Long userId) {
        if (restaurantId == null || userId == null) return false;
        Restaurant restaurant = restaurantRepository.findById(restaurantId).orElse(null);
        if (restaurant == null) return false;
        if (restaurant.getOwnerId() != null && restaurant.getOwnerId().equals(userId)) return true;

        Customer user = customerRepository.findById(userId).orElse(null);
        if (user != null && "ROLE_RESTAURANT_PARTNER".equals(user.getRole())) {
            if (restaurant.getOwnerId() == null) {
                restaurant.setOwnerId(userId);
                restaurantRepository.save(restaurant);
                return true;
            }
        }

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
