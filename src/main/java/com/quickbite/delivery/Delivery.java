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

    public DeliveryStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void updateStatus(DeliveryStatus status) {
        this.status = status;
        this.updatedAt = Instant.now();
    }
}
