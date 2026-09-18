package com.quickbite.restaurant;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import java.time.Instant;

@Entity
public class RestaurantJoinRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long restaurantId;
    private Long userId;
    
    @Enumerated(EnumType.STRING)
    private StaffRequestStatus status = StaffRequestStatus.PENDING_APPROVAL;
    
    private Instant createdAt = Instant.now();

    public RestaurantJoinRequest() {}

    public RestaurantJoinRequest(Long restaurantId, Long userId) {
        this.restaurantId = restaurantId;
        this.userId = userId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public StaffRequestStatus getStatus() { return status; }
    public void setStatus(StaffRequestStatus status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
