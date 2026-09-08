package com.quickbite.delivery;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Delivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private Long orderId;
    private String driverName;
    private String driverPhone;

    @Enumerated(EnumType.STRING)
    private DeliveryStatus status;
    private Instant createdAt;
    private Instant updatedAt;

    private Long driverId;
    private Instant assignedAt;
    private Instant pickedUpAt;
    private Instant outForDeliveryAt;
    private Instant deliveredAt;

    protected Delivery() {
    }

    public Delivery(Long orderId, String driverName, String driverPhone, DeliveryStatus status) {
        this.orderId = orderId;
        this.driverName = driverName;
        this.driverPhone = driverPhone;
        this.status = status;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public Long getId() {
        return id;
    }

    public Long getOrderId() {
        return orderId;
    }

    public String getDriverName() {
        return driverName;
    }

    public String getDriverPhone() {
        return driverPhone;
    }

    public Long getDriverId() {
        return driverId;
    }

    public DeliveryStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Instant getAssignedAt() {
        return assignedAt;
    }

    public Instant getPickedUpAt() {
        return pickedUpAt;
    }

    public Instant getOutForDeliveryAt() {
        return outForDeliveryAt;
    }

    public Instant getDeliveredAt() {
        return deliveredAt;
    }

    public void setDriver(Long driverId, String driverName, String driverPhone) {
        this.driverId = driverId;
        this.driverName = driverName;
        this.driverPhone = driverPhone;
    }

    public void updateStatus(DeliveryStatus status) {
        this.status = status;
        this.updatedAt = Instant.now();
        
        if (status == DeliveryStatus.ASSIGNED) this.assignedAt = this.updatedAt;
        if (status == DeliveryStatus.PICKED_UP) this.pickedUpAt = this.updatedAt;
        if (status == DeliveryStatus.OUT_FOR_DELIVERY) this.outForDeliveryAt = this.updatedAt;
        if (status == DeliveryStatus.DELIVERED) this.deliveredAt = this.updatedAt;
    }
}
