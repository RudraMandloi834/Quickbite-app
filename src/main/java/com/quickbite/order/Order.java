package com.quickbite.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long customerId;
    private Long restaurantId;
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;
    private Instant createdAt;

    private Instant acceptedAt;
    private Instant preparingAt;
    private Instant readyAt;
    private Instant assignedAt;
    private Instant pickedUpAt;
    private Instant outForDeliveryAt;
    private Instant deliveredAt;


    @Transient
    private List<OrderItem> items = List.of();

    protected Order() {
    }

    public Order(Long customerId, Long restaurantId, BigDecimal totalAmount) {
        this.customerId = customerId;
        this.restaurantId = restaurantId;
        this.totalAmount = totalAmount;
        this.status = OrderStatus.PLACED;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public Long getRestaurantId() {
        return restaurantId;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public List<OrderItem> getItems() {
        return items;
    }

    

    public void setItems(List<OrderItem> items) {
        this.items = items;
    }
    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    @jakarta.persistence.Transient
    private String customerName;
    @jakarta.persistence.Transient
    private String customerPhone;
    @jakarta.persistence.Transient
    private String deliveryAddress;
    private String paymentMethod;
    @jakarta.persistence.Transient
    private String paymentStatus;

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public Instant getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(Instant acceptedAt) { this.acceptedAt = acceptedAt; }
    public Instant getPreparingAt() { return preparingAt; }
    public void setPreparingAt(Instant preparingAt) { this.preparingAt = preparingAt; }
    public Instant getReadyAt() { return readyAt; }
    public void setReadyAt(Instant readyAt) { this.readyAt = readyAt; }
    public Instant getAssignedAt() { return assignedAt; }
    public void setAssignedAt(Instant assignedAt) { this.assignedAt = assignedAt; }
    public Instant getPickedUpAt() { return pickedUpAt; }
    public void setPickedUpAt(Instant pickedUpAt) { this.pickedUpAt = pickedUpAt; }
    public Instant getOutForDeliveryAt() { return outForDeliveryAt; }
    public void setOutForDeliveryAt(Instant outForDeliveryAt) { this.outForDeliveryAt = outForDeliveryAt; }
    public Instant getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(Instant deliveredAt) { this.deliveredAt = deliveredAt; }

    @jakarta.persistence.Transient
    private String driverName;
    @jakarta.persistence.Transient
    private String driverPhone;

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }
    public String getDriverPhone() { return driverPhone; }
    public void setDriverPhone(String driverPhone) { this.driverPhone = driverPhone; }
}
