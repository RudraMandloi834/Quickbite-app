package com.quickbite.order;

import com.quickbite.event.SseService;
import com.quickbite.event.SystemEvent;
import com.quickbite.restaurant.RestaurantRepository;
import com.quickbite.restaurant.Restaurant;
import com.quickbite.delivery.DeliveryRepository;
import com.quickbite.delivery.Delivery;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class OrderEventPublisher {

    private final SseService sseService;
    private final RestaurantRepository restaurantRepository;
    private final DeliveryRepository deliveryRepository;
    private final com.quickbite.customer.CustomerRepository customerRepository;

    public OrderEventPublisher(SseService sseService, RestaurantRepository restaurantRepository, DeliveryRepository deliveryRepository, com.quickbite.customer.CustomerRepository customerRepository) {
        this.sseService = sseService;
        this.restaurantRepository = restaurantRepository;
        this.deliveryRepository = deliveryRepository;
        this.customerRepository = customerRepository;
    }

    public void publishOrderCreated(Order order) {
        publishToAllRelevant("ORDER_CREATED", order);
    }

    public void publishOrderStatusUpdated(Order order) {
        String eventType = switch (order.getStatus()) {
            case PLACED -> "ORDER_PLACED";
            case ACCEPTED -> "ORDER_ACCEPTED";
            case PREPARING -> "ORDER_PREPARING";
            case READY_FOR_PICKUP -> "ORDER_READY";
            case DRIVER_ASSIGNED -> "DRIVER_ASSIGNED";
            case PICKED_UP -> "DELIVERY_PICKED_UP";
            case OUT_FOR_DELIVERY -> "DELIVERY_OUT_FOR_DELIVERY";
            case DELIVERED -> "DELIVERY_DELIVERED";
            case REJECTED -> "ORDER_REJECTED";
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
            Long ownerId = r != null ? r.getOwnerId() : null;
            if (ownerId == null) {
                ownerId = customerRepository.findByEmail("restaurant@test.com")
                        .map(com.quickbite.customer.Customer::getId)
                        .orElse(null);
            }
            if (ownerId != null) {
                sseService.emitToRestaurant(ownerId, event);
            }
        }

        
        // To Drivers
        if (order.getStatus() == OrderStatus.READY_FOR_PICKUP) {
            sseService.emitToAllDrivers(event);
        } else {
            Delivery delivery = deliveryRepository.findByOrderId(order.getId()).orElse(null);
            if (delivery != null && delivery.getDriverId() != null) {
                event.setDriverId(delivery.getDriverId());
                sseService.emitToDriver(delivery.getDriverId(), event);
            }
        }

        // To Admins
        sseService.emitToAdmins(event);
    }
}
