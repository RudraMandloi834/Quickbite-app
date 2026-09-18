package com.quickbite.order;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import java.time.Instant;

@Entity
public class OrderStatusHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long orderId;
    
    @Enumerated(EnumType.STRING)
    private OrderStatus previousStatus;
    
    @Enumerated(EnumType.STRING)
    private OrderStatus newStatus;
    
    private Long changedByUserId;
    private Instant timestamp = Instant.now();
    private String reason;

    public OrderStatusHistory() {}

    public OrderStatusHistory(Long orderId, OrderStatus previousStatus, OrderStatus newStatus, Long changedByUserId, String reason) {
        this.orderId = orderId;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.changedByUserId = changedByUserId;
        this.reason = reason;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public OrderStatus getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(OrderStatus previousStatus) { this.previousStatus = previousStatus; }
    public OrderStatus getNewStatus() { return newStatus; }
    public void setNewStatus(OrderStatus newStatus) { this.newStatus = newStatus; }
    public Long getChangedByUserId() { return changedByUserId; }
    public void setChangedByUserId(Long changedByUserId) { this.changedByUserId = changedByUserId; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
