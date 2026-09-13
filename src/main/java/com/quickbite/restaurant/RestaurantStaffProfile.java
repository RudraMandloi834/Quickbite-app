package com.quickbite.restaurant;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import java.time.LocalDateTime;

@Entity
@Table(name = "restaurant_staff_profile")
public class RestaurantStaffProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long userId;
    private Long restaurantId;
    
    @Enumerated(EnumType.STRING)
    private StaffRequestStatus approvalStatus;
    
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    
    protected RestaurantStaffProfile() {}
    
    public RestaurantStaffProfile(Long userId, Long restaurantId) {
        this.userId = userId;
        this.restaurantId = restaurantId;
        this.approvalStatus = StaffRequestStatus.PENDING_APPROVAL;
        this.createdAt = LocalDateTime.now();
    }
    
    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }
    
    public StaffRequestStatus getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(StaffRequestStatus approvalStatus) { this.approvalStatus = approvalStatus; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }
}
