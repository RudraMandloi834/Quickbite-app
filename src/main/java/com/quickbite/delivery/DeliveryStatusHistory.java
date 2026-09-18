package com.quickbite.delivery;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
public class DeliveryStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    
    private Long deliveryId;

    @Enumerated(EnumType.STRING)
    
    // removed nullable = false
    private DeliveryStatus previousStatus;

    @Enumerated(EnumType.STRING)
    
    private DeliveryStatus newStatus;

    private Long userId;

    
    private String userRole;

    
    private String reason;

    
    private Instant changedAt;

    protected DeliveryStatusHistory() {}

    public DeliveryStatusHistory(Long deliveryId, DeliveryStatus previousStatus, DeliveryStatus newStatus, Long userId, String userRole, String reason) {
        this.deliveryId = deliveryId;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.userId = userId;
        this.userRole = userRole;
        this.reason = reason;
        this.changedAt = Instant.now();
    }

    public Long getId() { return id; }
    public Long getDeliveryId() { return deliveryId; }
    public DeliveryStatus getPreviousStatus() { return previousStatus; }
    public DeliveryStatus getNewStatus() { return newStatus; }
    public Long getUserId() { return userId; }
    public String getUserRole() { return userRole; }
    public String getReason() { return reason; }
    public Instant getChangedAt() { return changedAt; }
}
