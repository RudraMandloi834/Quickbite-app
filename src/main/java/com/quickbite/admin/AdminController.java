package com.quickbite.admin;

import com.quickbite.customer.Customer;
import com.quickbite.customer.CustomerRepository;
import com.quickbite.delivery.Delivery;
import com.quickbite.delivery.DeliveryRepository;
import com.quickbite.order.Order;
import com.quickbite.order.OrderRepository;
import com.quickbite.restaurant.Restaurant;
import com.quickbite.restaurant.RestaurantRepository;
import com.quickbite.restaurant.RestaurantService;
import com.quickbite.restaurant.RestaurantStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('OPERATOR')")
public class AdminController {

    private final CustomerRepository customerRepository;
    private final RestaurantRepository restaurantRepository;
    private final OrderRepository orderRepository;
    private final DeliveryRepository deliveryRepository;
    private final RestaurantService restaurantService;

    public AdminController(CustomerRepository customerRepository, RestaurantRepository restaurantRepository,
                           OrderRepository orderRepository, DeliveryRepository deliveryRepository,
                           RestaurantService restaurantService) {
        this.customerRepository = customerRepository;
        this.restaurantRepository = restaurantRepository;
        this.orderRepository = orderRepository;
        this.deliveryRepository = deliveryRepository;
        this.restaurantService = restaurantService;
    }

    private RestaurantAdminDTO mapToDTO(Restaurant r) {
        Customer c = null;
        if (r.getOwnerId() != null) {
            c = customerRepository.findById(r.getOwnerId()).orElse(null);
        }
        RestaurantAdminDTO dto = new RestaurantAdminDTO(r, c);
        if (r.getTempPassword() != null) {
            dto.setTempPassword(r.getTempPassword());
        }
        return dto;
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

    @GetMapping("/restaurants/pending")
    public List<RestaurantAdminDTO> getPendingRestaurants() {
        return restaurantRepository.findByStatus(RestaurantStatus.PENDING_APPROVAL).stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @GetMapping("/restaurants/approved")
    public List<RestaurantAdminDTO> getApprovedRestaurants() {
        return restaurantRepository.findByStatus(RestaurantStatus.APPROVED).stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @GetMapping("/restaurants/rejected")
    public List<RestaurantAdminDTO> getRejectedRestaurants() {
        return restaurantRepository.findByStatus(RestaurantStatus.REJECTED).stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @PutMapping("/restaurants/{id}/approve")
    public RestaurantAdminDTO approveRestaurant(@PathVariable Long id) {
        Long operatorId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        return mapToDTO(restaurantService.approveRestaurantAdmin(id, operatorId));
    }

    @PutMapping("/restaurants/{id}/reject")
    public RestaurantAdminDTO rejectRestaurant(@PathVariable Long id, @RequestBody(required=false) java.util.Map<String, String> body) {
        Long operatorId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        String reason = body != null ? body.get("reason") : "";
        return mapToDTO(restaurantService.rejectRestaurantAdmin(id, operatorId, reason));
    }
}
