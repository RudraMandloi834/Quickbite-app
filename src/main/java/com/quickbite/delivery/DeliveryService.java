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

    public DeliveryService(DeliveryRepository deliveryRepository, OrderRepository orderRepository) {
        this.deliveryRepository = deliveryRepository;
        this.orderRepository = orderRepository;
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
                SAMPLE_DRIVER_NAME,
                SAMPLE_DRIVER_PHONE,
                DeliveryStatus.ASSIGNED
        ));
    }

    public Delivery getDelivery(Long deliveryId) {
        return deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found"));
    }

    @Transactional
    public Delivery updateStatus(Long deliveryId, DeliveryStatus status) {
        if (status == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Delivery status is required");
        }

        Delivery delivery = getDelivery(deliveryId);
        if (!isAllowedTransition(delivery.getStatus(), status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invalid delivery status transition");
        }

        delivery.updateStatus(status);
        return deliveryRepository.save(delivery);
    }

    private boolean isAllowedTransition(DeliveryStatus currentStatus, DeliveryStatus newStatus) {
        return (currentStatus == DeliveryStatus.ASSIGNED && newStatus == DeliveryStatus.PICKED_UP)
                || (currentStatus == DeliveryStatus.PICKED_UP && newStatus == DeliveryStatus.OUT_FOR_DELIVERY)
                || (currentStatus == DeliveryStatus.OUT_FOR_DELIVERY && newStatus == DeliveryStatus.DELIVERED);
    }
}
