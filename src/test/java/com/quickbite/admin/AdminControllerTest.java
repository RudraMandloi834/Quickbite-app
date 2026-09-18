package com.quickbite.admin;

import com.quickbite.customer.CustomerRepository;
import com.quickbite.delivery.DeliveryRepository;
import com.quickbite.order.OrderRepository;
import com.quickbite.restaurant.RestaurantRepository;
import com.quickbite.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AdminControllerTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private RestaurantRepository restaurantRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private DeliveryRepository deliveryRepository;

    @InjectMocks
    private AdminController adminController;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(
                new CustomUserDetails("admin@test.com", "pass", List.of(new SimpleGrantedAuthority("ROLE_OPERATOR")), 1L), null
            )
        );
    }

    @Test
    void operatorCanFetchAdminStats() {
        when(customerRepository.count()).thenReturn(10L);
        when(restaurantRepository.count()).thenReturn(5L);
        when(orderRepository.count()).thenReturn(50L);
        when(deliveryRepository.count()).thenReturn(20L);

        Map<String, Long> stats = adminController.getStats();

        assertEquals(10L, stats.get("totalCustomers"));
        assertEquals(5L, stats.get("totalRestaurants"));
        assertEquals(50L, stats.get("totalOrders"));
        assertEquals(20L, stats.get("totalDeliveries"));
    }

    @Test
    void operatorCanFetchAllOrders() {
        when(orderRepository.findAll()).thenReturn(Collections.emptyList());
        List<?> orders = adminController.getAllOrders();
        assertEquals(0, orders.size());
    }

    @Test
    void operatorCanFetchAllDeliveries() {
        when(deliveryRepository.findAll()).thenReturn(Collections.emptyList());
        List<?> deliveries = adminController.getAllDeliveries();
        assertEquals(0, deliveries.size());
    }
}
