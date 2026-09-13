package com.quickbite.delivery;

import com.quickbite.order.Order;
import com.quickbite.order.OrderRepository;
import com.quickbite.order.OrderStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DeliveryService {

    private static final String SAMPLE_DRIVER_NAME = "Rahul Driver";
    private static final String SAMPLE_DRIVER_PHONE = "9999999999";

    private final DeliveryRepository deliveryRepository;
    private final OrderRepository orderRepository;

    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    public DeliveryService(DeliveryRepository deliveryRepository, OrderRepository orderRepository, org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate) {
        this.deliveryRepository = deliveryRepository;
        this.orderRepository = orderRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public Delivery createDeliveryForOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (order.getStatus() == OrderStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Pending orders cannot have a delivery");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cancelled orders cannot have a delivery");
        }
        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only confirmed orders can have a delivery");
        }
        if (deliveryRepository.existsByOrderId(orderId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Delivery already exists for this order");
        }

        return deliveryRepository.save(new Delivery(
                orderId,
                null,
                null,
                DeliveryStatus.ASSIGNING
        ));
    }

    public Delivery getDelivery(Long deliveryId) {
        return deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found"));
    }

    public Delivery getDeliveryByOrderId(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!order.getCustomerId().equals(com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found for this order"));
    }

    @Transactional
    public Delivery assignDriver(Long deliveryId, Long driverId, String driverName, String driverPhone) {
        Delivery delivery = getDelivery(deliveryId);
        if (delivery.getStatus() != DeliveryStatus.ASSIGNING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Delivery is not waiting for assignment");
        }
        
        delivery.setDriver(driverId, driverName, driverPhone);
        delivery.updateStatus(DeliveryStatus.ASSIGNED);
        Delivery saved = deliveryRepository.save(delivery);
        publishDeliveryEvent(saved);
        return saved;
    }

    @Transactional
    public Delivery updateStatus(Long deliveryId, DeliveryStatus status, Long requestingDriverId) {
        if (status == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Delivery status is required");
        }

        Delivery delivery = getDelivery(deliveryId);
        
        if (requestingDriverId != null && !requestingDriverId.equals(delivery.getDriverId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not assigned to this delivery");
        }

        if (!isAllowedTransition(delivery.getStatus(), status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invalid delivery status transition");
        }

        delivery.updateStatus(status);
        Delivery saved = deliveryRepository.save(delivery);
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
        return deliveryRepository.findByStatus(DeliveryStatus.ASSIGNING);
    }

    public java.util.List<Delivery> getDeliveriesByDriver(Long driverId) {
        return deliveryRepository.findByDriverId(driverId);
    }

    private boolean isAllowedTransition(DeliveryStatus currentStatus, DeliveryStatus newStatus) {
        return (currentStatus == DeliveryStatus.ASSIGNING && newStatus == DeliveryStatus.ASSIGNED)
                || (currentStatus == DeliveryStatus.ASSIGNED && newStatus == DeliveryStatus.PICKED_UP)
                || (currentStatus == DeliveryStatus.PICKED_UP && newStatus == DeliveryStatus.OUT_FOR_DELIVERY)
                || (currentStatus == DeliveryStatus.OUT_FOR_DELIVERY && newStatus == DeliveryStatus.DELIVERED);
    }
}
