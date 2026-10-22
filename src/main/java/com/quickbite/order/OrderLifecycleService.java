package com.quickbite.order;

import com.quickbite.restaurant.RestaurantService;
import com.quickbite.delivery.DeliveryService;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.EnumSet;
import java.util.List;

@Service
public class OrderLifecycleService {

    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository historyRepository;
    private final RestaurantService restaurantService;
    private final DeliveryService deliveryService;
    private final OrderEventPublisher orderEventPublisher;

    public OrderLifecycleService(OrderRepository orderRepository,
                                 OrderStatusHistoryRepository historyRepository,
                                 RestaurantService restaurantService,
                                 @Lazy DeliveryService deliveryService,
                                 OrderEventPublisher orderEventPublisher) {
        this.orderRepository = orderRepository;
        this.historyRepository = historyRepository;
        this.restaurantService = restaurantService;
        this.deliveryService = deliveryService;
        this.orderEventPublisher = orderEventPublisher;
    }

    public Order transitionOrder(Long orderId, OrderStatus newStatus, Long requestingUserId, String role, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        
        OrderStatus previousStatus = order.getStatus();
        
        if (previousStatus == newStatus) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Order is already in status " + newStatus);
        }

        validateTransition(previousStatus, newStatus);
        validateRoleAccess(order, newStatus, requestingUserId, role);

        
        order.setStatus(newStatus);
        java.time.Instant now = java.time.Instant.now();
        if (newStatus == OrderStatus.ACCEPTED) order.setAcceptedAt(now);
        if (newStatus == OrderStatus.PREPARING) order.setPreparingAt(now);
        if (newStatus == OrderStatus.READY_FOR_PICKUP) order.setReadyAt(now);
        if (newStatus == OrderStatus.DRIVER_ASSIGNED) order.setAssignedAt(now);
        if (newStatus == OrderStatus.PICKED_UP) order.setPickedUpAt(now);
        if (newStatus == OrderStatus.OUT_FOR_DELIVERY) order.setOutForDeliveryAt(now);
        if (newStatus == OrderStatus.DELIVERED) order.setDeliveredAt(now);

        Order savedOrder = orderRepository.save(order);


        OrderStatusHistory history = new OrderStatusHistory(orderId, previousStatus, newStatus, requestingUserId, reason);
        historyRepository.save(history);

        if (newStatus == OrderStatus.READY_FOR_PICKUP) { 
            deliveryService.createDeliveryForOrder(savedOrder.getId()); 
        }
        orderEventPublisher.publishOrderStatusUpdated(savedOrder);
        
        return savedOrder;
    }

    
    private void validateTransition(OrderStatus current, OrderStatus next) {
        if (current == null) {
            if (next == OrderStatus.PLACED) return;
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Initial state must be PLACED");
        }
        boolean valid = switch (current) {
            case PLACED -> next == OrderStatus.ACCEPTED || next == OrderStatus.REJECTED || next == OrderStatus.CANCELLED;
            case ACCEPTED -> next == OrderStatus.PREPARING;
            case PREPARING -> next == OrderStatus.READY_FOR_PICKUP;
            case READY_FOR_PICKUP -> next == OrderStatus.DRIVER_ASSIGNED;
            case DRIVER_ASSIGNED -> next == OrderStatus.PICKED_UP;
            case PICKED_UP -> next == OrderStatus.OUT_FOR_DELIVERY;
            case OUT_FOR_DELIVERY -> next == OrderStatus.DELIVERED;
            case DELIVERED, CANCELLED, REJECTED -> false;
        };
        if (!valid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid transition from " + current + " to " + next);
        }
    }

    private void validateRoleAccess(Order order, OrderStatus next, Long userId, String role) {
        boolean isOperator = "ROLE_OPERATOR".equals(role);
        boolean isCustomer = "ROLE_CUSTOMER".equals(role);
        boolean isRestaurant = "ROLE_RESTAURANT_PARTNER".equals(role);
        boolean isDriver = "ROLE_DRIVER".equals(role);

        if (isOperator || userId == null) return;

        if (isRestaurant && !restaurantService.hasRestaurantAccess(order.getRestaurantId(), userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Restaurant access denied");
        }
        
        if (isDriver) {
            if (next != OrderStatus.DRIVER_ASSIGNED && !deliveryService.isDriverAssignedToOrder(order.getId(), userId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Driver access denied");
            }
        }

        switch (next) {
            case CANCELLED:
                if (isCustomer && !order.getCustomerId().equals(userId)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Customer access denied");
                }
                if (isDriver || isRestaurant) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only customer can cancel");
                break;
            case REJECTED, ACCEPTED, PREPARING, READY_FOR_PICKUP:
                if (isDriver) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Driver cannot mark " + next);
                if (isCustomer) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Customer cannot mark " + next);
                break;
            case DRIVER_ASSIGNED, PICKED_UP, OUT_FOR_DELIVERY, DELIVERED:
                if (isRestaurant) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Restaurant cannot mark " + next);
                if (isCustomer) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Customer cannot mark " + next);
                break;
            default:
                break;
        }
    }

}
