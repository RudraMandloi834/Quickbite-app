package com.quickbite.order;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.quickbite.restaurant.RestaurantService;
import com.quickbite.security.SecurityUtils;
import java.util.List;
import com.quickbite.customer.Customer;
import com.quickbite.customer.CustomerRepository;
import com.quickbite.delivery.DeliveryRepository;
import com.quickbite.delivery.Delivery;

@Service
public class RestaurantOrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final RestaurantService restaurantService;
    private final OrderEventPublisher orderEventPublisher;
    private final CustomerRepository customerRepository;
    private final DeliveryRepository deliveryRepository;
    private final com.quickbite.payment.PaymentRepository paymentRepository;
    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private OrderLifecycleService lifecycleService;

    public RestaurantOrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            RestaurantService restaurantService,
            OrderEventPublisher orderEventPublisher,
            CustomerRepository customerRepository,
            DeliveryRepository deliveryRepository,
            com.quickbite.payment.PaymentRepository paymentRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.restaurantService = restaurantService;
        this.orderEventPublisher = orderEventPublisher;
        this.customerRepository = customerRepository;
        this.deliveryRepository = deliveryRepository;
        this.paymentRepository = paymentRepository;
    }

    public List<Order> getRestaurantOrders(Long restaurantId) {
        Long userId = SecurityUtils.getAuthenticatedCustomerId();
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        if (!restaurantService.hasRestaurantAccess(restaurantId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        
        List<Order> orders = orderRepository.findTop50ByRestaurantIdOrderByCreatedAtDesc(restaurantId);
        for (Order order : orders) {
            order.setItems(orderItemRepository.findByOrderId(order.getId()));
            Customer c = customerRepository.findById(order.getCustomerId()).orElse(null);
            if (c != null) {
                order.setCustomerName(c.getName());
                order.setCustomerPhone(c.getPhone());
            }
            order.setDeliveryAddress("Pending Delivery System Address");
            
            order.setPaymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod() : "CARD");
            if (paymentRepository != null) {
                paymentRepository.findByOrderId(order.getId()).ifPresentOrElse(
                    p -> order.setPaymentStatus(p.getStatus().name()),
                    () -> order.setPaymentStatus("PENDING")
                );
            }
            Delivery delivery = deliveryRepository.findByOrderId(order.getId()).orElse(null);
            if (delivery != null) {
                order.setDriverName(delivery.getDriverName());
                order.setDriverPhone(delivery.getDriverPhone());
            }
        }
        return orders;
    }

    public Order getRestaurantOrder(Long restaurantId, Long orderId) {
        Long userId = SecurityUtils.getAuthenticatedCustomerId();
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        if (!restaurantService.hasRestaurantAccess(restaurantId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
                
        if (!order.getRestaurantId().equals(restaurantId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order does not belong to this restaurant");
        }
        
        order.setItems(orderItemRepository.findByOrderId(orderId));
        Customer c = customerRepository.findById(order.getCustomerId()).orElse(null);
        if (c != null) {
            order.setCustomerName(c.getName());
            order.setCustomerPhone(c.getPhone());
        }
        order.setDeliveryAddress("Pending Delivery System Address");
        
        order.setPaymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod() : "CARD");
        if (paymentRepository != null) {
            paymentRepository.findByOrderId(order.getId()).ifPresentOrElse(
                p -> order.setPaymentStatus(p.getStatus().name()),
                () -> order.setPaymentStatus("PENDING")
            );
        }
        Delivery delivery = deliveryRepository.findByOrderId(order.getId()).orElse(null);
        if (delivery != null) {
            order.setDriverName(delivery.getDriverName());
            order.setDriverPhone(delivery.getDriverPhone());
        }
        return order;
    }

    @Transactional
    public Order updateRestaurantOrderStatus(Long restaurantId, Long orderId, UpdateOrderStatusRequest request) {
        Order order = getRestaurantOrder(restaurantId, orderId); // Validates auth and ownership

        if (request.status() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required");
        }
        
        Long userId = SecurityUtils.getAuthenticatedCustomerId();
        return lifecycleService.transitionOrder(orderId, request.status(), userId, "ROLE_RESTAURANT_PARTNER", "Updated by restaurant");
    }
}
