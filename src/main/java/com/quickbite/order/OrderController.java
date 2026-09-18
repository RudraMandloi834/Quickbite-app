package com.quickbite.order;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final OrderLifecycleService lifecycleService;

    public OrderController(OrderService orderService, OrderLifecycleService lifecycleService) {
        this.orderService = orderService;
        this.lifecycleService = lifecycleService;
    }

    @PostMapping("/from-cart/{cartId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Order createOrderFromCart(@PathVariable Long cartId) {
        return orderService.createOrderFromCart(cartId);
    }

    @GetMapping("/{orderId}")
    public Order getOrder(@PathVariable Long orderId) {
        return orderService.getOrder(orderId);
    }

    @DeleteMapping("/{orderId}")
    public Order cancelOrder(@PathVariable Long orderId) {
        Long userId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        return lifecycleService.transitionOrder(orderId, OrderStatus.CANCELLED, userId, "ROLE_CUSTOMER", "User cancelled order");
    }
}
