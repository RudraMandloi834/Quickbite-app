package com.quickbite.restaurant;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.quickbite.security.SecurityUtils;
import com.quickbite.order.OrderRepository;
import com.quickbite.order.OrderStatus;
import com.quickbite.order.Order;
import com.quickbite.menu.MenuItemRepository;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/restaurants/{restaurantId}/dashboard-summary")
public class RestaurantDashboardController {

    private final RestaurantService restaurantService;
    private final RestaurantRepository restaurantRepository;
    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;

    public RestaurantDashboardController(
            RestaurantService restaurantService, 
            RestaurantRepository restaurantRepository,
            OrderRepository orderRepository,
            MenuItemRepository menuItemRepository) {
        this.restaurantService = restaurantService;
        this.restaurantRepository = restaurantRepository;
        this.orderRepository = orderRepository;
        this.menuItemRepository = menuItemRepository;
    }

    @GetMapping
    public RestaurantDashboardSummary getSummary(@PathVariable Long restaurantId) {
        Long userId = SecurityUtils.getAuthenticatedCustomerId();
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        if (!restaurantService.hasRestaurantAccess(restaurantId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Restaurant not found"));
                
        long activeMenu = menuItemRepository.findByRestaurantId(restaurantId).stream()
                .filter(com.quickbite.menu.MenuItem::isAvailable).count();
                
        List<Order> allOrders = orderRepository.findTop50ByRestaurantIdOrderByCreatedAtDesc(restaurantId);
        
        long pending = allOrders.stream().filter(o -> o.getStatus() == OrderStatus.PENDING).count();
        long active = allOrders.stream().filter(o -> o.getStatus() == OrderStatus.CONFIRMED || o.getStatus() == OrderStatus.PREPARING || o.getStatus() == OrderStatus.READY).count();
        
        List<Order> recent = allOrders.stream().limit(5).collect(Collectors.toList());
        
        return new RestaurantDashboardSummary(
                restaurant.getName(),
                restaurant.getStatus(),
                activeMenu,
                pending,
                active,
                recent
        );
    }
}
