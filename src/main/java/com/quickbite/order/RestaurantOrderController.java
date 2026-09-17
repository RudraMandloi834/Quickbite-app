package com.quickbite.order;

import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/restaurants/{restaurantId}/orders")
public class RestaurantOrderController {

    private final RestaurantOrderService restaurantOrderService;

    public RestaurantOrderController(RestaurantOrderService restaurantOrderService) {
        this.restaurantOrderService = restaurantOrderService;
    }

    @GetMapping
    public List<Order> getRestaurantOrders(@PathVariable Long restaurantId) {
        return restaurantOrderService.getRestaurantOrders(restaurantId);
    }

    @GetMapping("/{orderId}")
    public Order getRestaurantOrder(@PathVariable Long restaurantId, @PathVariable Long orderId) {
        return restaurantOrderService.getRestaurantOrder(restaurantId, orderId);
    }

    @PatchMapping("/{orderId}/status")
    public Order updateOrderStatus(
            @PathVariable Long restaurantId, 
            @PathVariable Long orderId, 
            @RequestBody UpdateOrderStatusRequest request) {
        return restaurantOrderService.updateRestaurantOrderStatus(restaurantId, orderId, request);
    }
}
