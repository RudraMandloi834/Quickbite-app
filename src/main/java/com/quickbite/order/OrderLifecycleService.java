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
        Order savedOrder = orderRepository.save(order);

        OrderStatusHistory history = new OrderStatusHistory(orderId, previousStatus, newStatus, requestingUserId, reason);
        historyRepository.save(history);

        orderEventPublisher.publishOrderStatusUpdated(savedOrder);
        
        return savedOrder;
    }

    private void validateTransition(OrderStatus current, OrderStatus next) {
        boolean valid = switch (current) {
            case CREATED -> next == OrderStatus.PAYMENT_PENDING || next == OrderStatus.CANCELLED;
            case PAYMENT_PENDING -> next == OrderStatus.PAID || next == OrderStatus.PAYMENT_FAILED || next == OrderStatus.CANCELLED;
            case PAID -> next == OrderStatus.CONFIRMED || next == OrderStatus.REFUNDED;
            case CONFIRMED -> next == OrderStatus.RESTAURANT_ACCEPTED || next == OrderStatus.CANCELLED || next == OrderStatus.REFUNDED;
            case RESTAURANT_ACCEPTED -> next == OrderStatus.PREPARING || next == OrderStatus.CANCELLED;
            case PREPARING -> next == OrderStatus.READY_FOR_PICKUP || next == OrderStatus.CANCELLED;
            case READY_FOR_PICKUP -> next == OrderStatus.DRIVER_ASSIGNED || next == OrderStatus.CANCELLED;
            case DRIVER_ASSIGNED -> next == OrderStatus.PICKED_UP || next == OrderStatus.CANCELLED;
            case PICKED_UP -> next == OrderStatus.OUT_FOR_DELIVERY;
            case OUT_FOR_DELIVERY -> next == OrderStatus.DELIVERED;
            case DELIVERED, PAYMENT_FAILED, CANCELLED, REFUNDED -> false;
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

        // System/Operator can do anything
        if (isOperator || userId == null) return;

        if (isRestaurant && !restaurantService.hasRestaurantAccess(order.getRestaurantId(), userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Restaurant access denied");
        }
        
        if (isDriver) {
            if (next == OrderStatus.DRIVER_ASSIGNED) {
                // Anyone with driver role can assign themselves if it's currently unassigned.
                // We assume this is fine since it's the assignment step itself.
            } else {
                if (!deliveryService.isDriverAssignedToOrder(order.getId(), userId)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Driver access denied");
                }
            }
        }

        switch (next) {
            case CANCELLED:
                if (isCustomer && !order.getCustomerId().equals(userId)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Customer access denied");
                }
                break;
            case PAYMENT_PENDING, PAID, PAYMENT_FAILED, CONFIRMED, REFUNDED:
                if (isDriver || isRestaurant) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Role cannot update payment state");
                }
                break;
            case RESTAURANT_ACCEPTED, PREPARING, READY_FOR_PICKUP:
                if (isDriver) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Driver cannot mark " + next);
                if (isCustomer) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Customer cannot mark " + next);
                break;
            case DRIVER_ASSIGNED, PICKED_UP, OUT_FOR_DELIVERY:
                if (isRestaurant) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Restaurant cannot mark " + next);
                if (isCustomer) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Customer cannot mark " + next);
                break;
            case DELIVERED:
                if (isCustomer) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Customer cannot mark delivered");
                if (isRestaurant) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Restaurant cannot mark delivered");
                break;
        }
    }
}
