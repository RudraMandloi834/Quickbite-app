package com.quickbite;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import com.quickbite.customer.CustomerRepository;
import com.quickbite.customer.Customer;
import com.quickbite.restaurant.RestaurantRepository;
import com.quickbite.restaurant.Restaurant;
import com.quickbite.restaurant.RestaurantStaffProfileRepository;
import com.quickbite.restaurant.RestaurantStaffProfile;
import com.quickbite.order.OrderRepository;
import com.quickbite.order.Order;
import com.quickbite.delivery.DeliveryRepository;
import com.quickbite.delivery.Delivery;
import com.quickbite.delivery.DeliveryStatus;
import org.junit.jupiter.api.BeforeEach;
import java.math.BigDecimal;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:testdb")
@AutoConfigureMockMvc
public class SecurityPatchTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private RestaurantRepository restaurantRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private DeliveryRepository deliveryRepository;

    private Long customerId1;
    private Long customerId2;
    private Long restaurantId1;
    private Long restaurantId2;
    private Long orderId1;
    private Long deliveryId1;

    @BeforeEach
    void setup() {
        deliveryRepository.deleteAll();
        orderRepository.deleteAll();
        restaurantRepository.deleteAll();
        customerRepository.deleteAll();

        Customer c1 = customerRepository.save(new Customer("C1", "c1@test.com", "111", "pass", "ROLE_CUSTOMER"));
        Customer c2 = customerRepository.save(new Customer("C2", "c2@test.com", "222", "pass", "ROLE_CUSTOMER"));
        customerId1 = c1.getId();
        customerId2 = c2.getId();

        Restaurant r1 = restaurantRepository.save(new Restaurant("R1", "Cuisine", "Loc", 5.0, "Addr", "City", "Area", 0.0, 0.0, "Hours", 5.0, "img"));
        r1.setOwnerId(customerId1);
        r1.setStatus(com.quickbite.restaurant.RestaurantStatus.APPROVED);
        restaurantRepository.save(r1);
        restaurantId1 = r1.getId();

        Restaurant r2 = restaurantRepository.save(new Restaurant("R2", "Cuisine", "Loc", 5.0, "Addr", "City", "Area", 0.0, 0.0, "Hours", 5.0, "img"));
        r2.setOwnerId(customerId2);
        r2.setStatus(com.quickbite.restaurant.RestaurantStatus.APPROVED);
        restaurantRepository.save(r2);
        restaurantId2 = r2.getId();

        Order o1 = new Order(customerId1, restaurantId1, BigDecimal.TEN);
        o1.confirm();
        orderRepository.save(o1);
        orderId1 = o1.getId();

        Delivery d1 = new Delivery(orderId1, null, null, DeliveryStatus.ASSIGNING);
        deliveryRepository.save(d1);
        deliveryId1 = d1.getId();
    }

    @Test
    void unauthenticatedReturns401() throws Exception {
        mockMvc.perform(get("/api/deliveries/" + deliveryId1))
                .andExpect(status().isUnauthorized());
    }
}
