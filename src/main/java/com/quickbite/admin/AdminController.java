package com.quickbite.admin;

import com.quickbite.customer.Customer;
import com.quickbite.customer.CustomerRepository;
import com.quickbite.delivery.Delivery;
import com.quickbite.delivery.DeliveryRepository;
import com.quickbite.order.Order;
import com.quickbite.order.OrderRepository;
import com.quickbite.restaurant.Restaurant;
import com.quickbite.restaurant.RestaurantRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('OPERATOR')")
public class AdminController {

    private final CustomerRepository customerRepository;
    private final RestaurantRepository restaurantRepository;
    private final OrderRepository orderRepository;
    private final DeliveryRepository deliveryRepository;

    public AdminController(CustomerRepository customerRepository, RestaurantRepository restaurantRepository,
                           OrderRepository orderRepository, DeliveryRepository deliveryRepository) {
        this.customerRepository = customerRepository;
        this.restaurantRepository = restaurantRepository;
        this.orderRepository = orderRepository;
        this.deliveryRepository = deliveryRepository;
    }

    @GetMapping("/stats")
    public Map<String, Long> getStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalCustomers", customerRepository.count());
        stats.put("totalRestaurants", restaurantRepository.count());
        stats.put("totalOrders", orderRepository.count());
        stats.put("totalDeliveries", deliveryRepository.count());
        return stats;
    }

    @GetMapping("/orders")
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @GetMapping("/deliveries")
    public List<Delivery> getAllDeliveries() {
        return deliveryRepository.findAll();
    }

    @GetMapping("/restaurants")
    public List<Restaurant> getAllRestaurants() {
        return restaurantRepository.findAll();
    }
}
