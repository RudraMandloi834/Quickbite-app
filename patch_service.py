import re

file_path = "src/main/java/com/quickbite/restaurant/RestaurantService.java"
with open(file_path, "r") as f:
    content = f.read()

# Add repositories
content = content.replace("private final PasswordEncoder passwordEncoder;", """private final PasswordEncoder passwordEncoder;
    private final RestaurantInvitationRepository invitationRepository;
    private final RestaurantJoinRequestRepository joinRequestRepository;""")

content = content.replace("CustomerRepository customerRepository,", """CustomerRepository customerRepository,
                             RestaurantInvitationRepository invitationRepository,
                             RestaurantJoinRequestRepository joinRequestRepository,""")

content = content.replace("this.passwordEncoder = passwordEncoder;", """this.passwordEncoder = passwordEncoder;
        this.invitationRepository = invitationRepository;
        this.joinRequestRepository = joinRequestRepository;""")

# Add hasRestaurantAccess logic
has_access_old = """if (profile.getApprovalStatus() == StaffRequestStatus.APPROVED) {
                return true;
            }
        }
        return false;"""
has_access_new = """if (profile.getApprovalStatus() == StaffRequestStatus.APPROVED) {
                return true;
            }
        }
        
        List<RestaurantJoinRequest> joinRequests = joinRequestRepository.findByRestaurantId(restaurantId);
        for (RestaurantJoinRequest req : joinRequests) {
            if (req.getUserId().equals(userId) && req.getStatus() == StaffRequestStatus.APPROVED) {
                return true;
            }
        }
        
        return false;"""
content = content.replace(has_access_old, has_access_new)

# Add new methods for invitations and join requests
new_methods = """
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
        return joinRequestRepository.save(req);
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
"""
content += new_methods

with open(file_path, "w") as f:
    f.write(content)

