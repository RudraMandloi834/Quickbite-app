package com.quickbite.order;

import com.quickbite.event.SseService;
import com.quickbite.event.SystemEvent;
import com.quickbite.restaurant.RestaurantRepository;
import com.quickbite.restaurant.Restaurant;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class OrderEventPublisher {

    private final SseService sseService;
    private final RestaurantRepository restaurantRepository;

    public OrderEventPublisher(SseService sseService, RestaurantRepository restaurantRepository) {
        this.sseService = sseService;
        this.restaurantRepository = restaurantRepository;
    }

    public void publishOrderCreated(Order order) {
        publishToAllRelevant("ORDER_CREATED", order);
    }

    public void publishOrderStatusUpdated(Order order) {
        String eventType = switch (order.getStatus()) {
            case CONFIRMED -> "ORDER_CONFIRMED";
            case RESTAURANT_ACCEPTED -> "ORDER_ACCEPTED";
            case PREPARING -> "ORDER_PREPARING";
            case READY_FOR_PICKUP -> "ORDER_READY";
            case DRIVER_ASSIGNED -> "DRIVER_ASSIGNED";
            case PICKED_UP -> "DELIVERY_PICKED_UP";
            case OUT_FOR_DELIVERY -> "DELIVERY_OUT_FOR_DELIVERY";
            case DELIVERED -> "DELIVERY_DELIVERED";
            case PAYMENT_PENDING -> "ORDER_PAYMENT_PENDING";
            case PAYMENT_FAILED -> "ORDER_PAYMENT_FAILED";
            case CANCELLED -> "ORDER_CANCELLED";
            default -> "ORDER_STATUS_UPDATED";
        };
        publishToAllRelevant(eventType, order);
    }

    private void publishToAllRelevant(String eventType, Order order) {
        SystemEvent event = new SystemEvent(
                UUID.randomUUID().toString(),
                eventType,
                order.getId(),
                order.getRestaurantId(),
                order.getCustomerId(),
                null,
                order.getStatus().name()
        );

        // To Customer
        if (order.getCustomerId() != null) {
            sseService.emitToCustomer(order.getCustomerId(), event);
        }

        // To Restaurant Owner
        if (order.getRestaurantId() != null) {
            Restaurant r = restaurantRepository.findById(order.getRestaurantId()).orElse(null);
            if (r != null && r.getOwnerId() != null) {
                sseService.emitToRestaurant(r.getOwnerId(), event);
            }
        }

        // To Admins
        sseService.emitToAdmins(event);
    }
}
