package com.quickbite.event;
import java.time.Instant;
public class SystemEvent {
    private String eventId;
    private String type;
    private Long orderId;
    private Long restaurantId;
    private Long customerId;
    private Long driverId;
    private String status;
    private Instant occurredAt;
    public SystemEvent() {}
    public SystemEvent(String eventId, String type, Long orderId, Long restaurantId, Long customerId, Long driverId, String status) {
        this.eventId = eventId;
        this.type = type;
        this.orderId = orderId;
        this.restaurantId = restaurantId;
        this.customerId = customerId;
        this.driverId = driverId;
        this.status = status;
        this.occurredAt = Instant.now();
    }
    public String getEventId() { return eventId; }
    public String getType() { return type; }
    public Long getOrderId() { return orderId; }
    public Long getRestaurantId() { return restaurantId; }
    public Long getCustomerId() { return customerId; }
    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }
    public String getStatus() { return status; }
    public Instant getOccurredAt() { return occurredAt; }
}
