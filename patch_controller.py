import re

file_path = "src/main/java/com/quickbite/restaurant/RestaurantController.java"
with open(file_path, "r") as f:
    content = f.read()

new_endpoints = """

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
"""

# Replace the last `}` with the new endpoints
content = content.rsplit("}", 1)[0] + new_endpoints

with open(file_path, "w") as f:
    f.write(content)

