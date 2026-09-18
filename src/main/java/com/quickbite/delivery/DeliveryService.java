package com.quickbite.delivery;

import com.quickbite.order.Order;
import com.quickbite.order.OrderRepository;
import com.quickbite.order.OrderStatus;
import com.quickbite.restaurant.RestaurantService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final OrderRepository orderRepository;
    private final RestaurantService restaurantService;
    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private com.quickbite.order.OrderLifecycleService orderLifecycleService;

    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    private final DeliveryStatusHistoryRepository historyRepository;

    public DeliveryService(DeliveryRepository deliveryRepository, OrderRepository orderRepository, RestaurantService restaurantService, org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate, DeliveryStatusHistoryRepository historyRepository) {
        this.deliveryRepository = deliveryRepository;
        this.orderRepository = orderRepository;
        this.restaurantService = restaurantService;
        this.messagingTemplate = messagingTemplate;
        this.historyRepository = historyRepository;
    }

    private void verifyDeliveryCreationAccess(Order order) {
        Long userId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthenticated");
        }

        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OPERATOR"))) {
            return;
        }

        if (userId.equals(order.getCustomerId())) {
            return;
        }

        if (restaurantService.hasRestaurantAccess(order.getRestaurantId(), userId)) {
            return;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to create delivery for this order");
    }

    private void verifyDeliveryAccess(Delivery delivery) {
        Long userId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthenticated");
        }

        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OPERATOR"))) {
            return;
        }

        if (userId.equals(delivery.getDriverId())) {
            return;
        }

        Order order = orderRepository.findById(delivery.getOrderId()).orElse(null);
        if (order != null) {
            if (userId.equals(order.getCustomerId())) {
                return;
            }
            if (restaurantService.hasRestaurantAccess(order.getRestaurantId(), userId)) {
                return;
            }
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to this delivery");
    }

    @Transactional
    public Delivery createDeliveryForOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        verifyDeliveryCreationAccess(order);

        if (order.getStatus() == OrderStatus.CREATED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Pending orders cannot have a delivery");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cancelled orders cannot have a delivery");
        }
        if (order.getStatus() == OrderStatus.CREATED || order.getStatus() == OrderStatus.PAYMENT_PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only confirmed orders can have a delivery");
        }
        if (deliveryRepository.existsByOrderId(orderId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Delivery already exists for this order");
        }

        Delivery delivery = deliveryRepository.save(new Delivery(
                orderId,
                null,
                null,
                DeliveryStatus.AVAILABLE
        ));
        Long userId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        String role = "ROLE_SYSTEM";
        historyRepository.save(new DeliveryStatusHistory(delivery.getId(), null, DeliveryStatus.AVAILABLE, userId, role, "Delivery created"));
        return delivery;
    }

    
    public boolean isDriverAssignedToOrder(Long orderId, Long driverId) {
        return deliveryRepository.findByOrderId(orderId)
                .map(d -> driverId.equals(d.getDriverId()))
                .orElse(false);
    }

    public Delivery getDelivery(Long deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found"));
        verifyDeliveryAccess(delivery);
        return delivery;
    }

    public Delivery getDeliveryByOrderId(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found for this order"));

        verifyDeliveryAccess(delivery);
        return delivery;
    }

    @Transactional
    public Delivery assignDriver(Long deliveryId, Long driverId, String driverName, String driverPhone) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found"));

        if (delivery.getStatus() != DeliveryStatus.AVAILABLE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Delivery is not waiting for assignment");
        }

        DeliveryStatus previousStatus = delivery.getStatus();
        delivery.setDriver(driverId, driverName, driverPhone);
        delivery.updateStatus(DeliveryStatus.ASSIGNED);
        Delivery saved = deliveryRepository.save(delivery);
        historyRepository.save(new DeliveryStatusHistory(saved.getId(), previousStatus, DeliveryStatus.ASSIGNED, driverId, "ROLE_DRIVER", "Driver assigned"));
        orderLifecycleService.transitionOrder(saved.getOrderId(), com.quickbite.order.OrderStatus.DRIVER_ASSIGNED, driverId, "ROLE_DRIVER", "Driver assigned");
        publishDeliveryEvent(saved);
        return saved;
    }

    @Transactional
    public Delivery updateStatus(Long deliveryId, DeliveryStatus status, Long requestingDriverId) {
        if (status == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Delivery status is required");
        }

        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found"));

        if (requestingDriverId != null && !requestingDriverId.equals(delivery.getDriverId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not assigned to this delivery");
        }

        if (!isAllowedTransition(delivery.getStatus(), status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invalid delivery status transition");
        }

        DeliveryStatus previousStatus = delivery.getStatus();
        delivery.updateStatus(status);
        Delivery saved = deliveryRepository.save(delivery);
        Long userId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        historyRepository.save(new DeliveryStatusHistory(saved.getId(), previousStatus, status, userId, "ROLE_DRIVER", "Delivery update"));
        com.quickbite.order.OrderStatus newOrderStatus = null;
        if (status == DeliveryStatus.PICKED_UP) newOrderStatus = com.quickbite.order.OrderStatus.PICKED_UP;
        if (status == DeliveryStatus.OUT_FOR_DELIVERY) newOrderStatus = com.quickbite.order.OrderStatus.OUT_FOR_DELIVERY;
        if (status == DeliveryStatus.DELIVERED) newOrderStatus = com.quickbite.order.OrderStatus.DELIVERED;
        if (newOrderStatus != null) {
            orderLifecycleService.transitionOrder(saved.getOrderId(), newOrderStatus, requestingDriverId, "ROLE_DRIVER", "Delivery update");
        }
        publishDeliveryEvent(saved);
        return saved;
    }

    private void publishDeliveryEvent(Delivery delivery) {
        DeliveryStatusEvent event = new DeliveryStatusEvent(
                delivery.getId(),
                delivery.getOrderId(),
                delivery.getStatus(),
                delivery.getUpdatedAt()
        );
        messagingTemplate.convertAndSend("/topic/deliveries/" + delivery.getId(), event);
        messagingTemplate.convertAndSend("/topic/deliveries", event);
    }

    public java.util.List<Delivery> getAvailableDeliveries() {
        return deliveryRepository.findByStatus(DeliveryStatus.AVAILABLE);
    }

    public java.util.List<Delivery> getDeliveriesByDriver(Long driverId) {
        return deliveryRepository.findByDriverId(driverId);
    }

    private boolean isAllowedTransition(DeliveryStatus currentStatus, DeliveryStatus newStatus) {
        return (currentStatus == DeliveryStatus.AVAILABLE && newStatus == DeliveryStatus.ASSIGNED)
                || (currentStatus == DeliveryStatus.ASSIGNED && newStatus == DeliveryStatus.PICKED_UP)
                || (currentStatus == DeliveryStatus.PICKED_UP && newStatus == DeliveryStatus.OUT_FOR_DELIVERY)
                || (currentStatus == DeliveryStatus.OUT_FOR_DELIVERY && newStatus == DeliveryStatus.DELIVERED);
    }
}
