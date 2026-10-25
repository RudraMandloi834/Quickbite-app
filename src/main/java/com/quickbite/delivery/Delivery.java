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
    @jakarta.persistence.Version
    private Long version;

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

    @jakarta.persistence.Transient
    private String restaurantName;
    @jakarta.persistence.Transient
    private String restaurantAddress;
    @jakarta.persistence.Transient
    private String customerName;
    @jakarta.persistence.Transient
    private String customerPhone;
    @jakarta.persistence.Transient
    private String customerAddress;
    @jakarta.persistence.Transient
    private java.math.BigDecimal orderTotal;
    @jakarta.persistence.Transient
    private String orderItemsSummary;
    @jakarta.persistence.Transient
    private String paymentMethod;
    @jakarta.persistence.Transient
    private String paymentStatus;

    public String getRestaurantName() { return restaurantName; }
    public void setRestaurantName(String name) { this.restaurantName = name; }
    public String getRestaurantAddress() { return restaurantAddress; }
    public void setRestaurantAddress(String address) { this.restaurantAddress = address; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String name) { this.customerName = name; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String phone) { this.customerPhone = phone; }
    public String getCustomerAddress() { return customerAddress; }
    public void setCustomerAddress(String address) { this.customerAddress = address; }
    public java.math.BigDecimal getOrderTotal() { return orderTotal; }
    public void setOrderTotal(java.math.BigDecimal total) { this.orderTotal = total; }
    public String getOrderItemsSummary() { return orderItemsSummary; }
    public void setOrderItemsSummary(String items) { this.orderItemsSummary = items; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
}
