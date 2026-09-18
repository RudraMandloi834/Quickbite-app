package com.quickbite.order;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class OrderEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public OrderEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishOrderCreated(Order order) {
        publishEvent("ORDER_CREATED", order);
    }

    public void publishOrderStatusUpdated(Order order) {
        publishEvent("ORDER_STATUS_UPDATED", order);
    }

    private void publishEvent(String eventType, Order order) {
        OrderEvent event = new OrderEvent(
                eventType,
                order.getId(),
                order.getRestaurantId(),
                order.getStatus(),
                order.getTotalAmount(),
                Instant.now()
        );
        messagingTemplate.convertAndSend("/topic/restaurants/" + order.getRestaurantId() + "/orders", event);
    }
}
