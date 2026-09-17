package com.quickbite.order;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.quickbite.restaurant.RestaurantService;
import com.quickbite.security.SecurityUtils;
import java.util.List;

@Service
public class RestaurantOrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final RestaurantService restaurantService;

    public RestaurantOrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            RestaurantService restaurantService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.restaurantService = restaurantService;
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
        return order;
    }

    @Transactional
    public Order updateRestaurantOrderStatus(Long restaurantId, Long orderId, UpdateOrderStatusRequest request) {
        Order order = getRestaurantOrder(restaurantId, orderId); // Validates auth and ownership

        if (request.status() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required");
        }
        
        if (request.status() == OrderStatus.CANCELLED && order.getStatus() != OrderStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending orders can be cancelled");
        }
        
        order.setStatus(request.status());
        return orderRepository.save(order);
    }
}
