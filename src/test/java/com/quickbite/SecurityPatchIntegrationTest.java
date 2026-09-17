package com.quickbite;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import com.quickbite.customer.CustomerRepository;
import com.quickbite.customer.Customer;
import com.quickbite.restaurant.RestaurantRepository;
import com.quickbite.restaurant.Restaurant;
import com.quickbite.restaurant.RestaurantStaffProfileRepository;
import com.quickbite.restaurant.RestaurantStaffProfile;
import com.quickbite.restaurant.StaffRequestStatus;
import com.quickbite.order.OrderRepository;
import com.quickbite.order.Order;
import com.quickbite.delivery.DeliveryRepository;
import com.quickbite.delivery.Delivery;
import com.quickbite.delivery.DeliveryStatus;
import com.quickbite.security.JwtService;
import com.quickbite.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import java.math.BigDecimal;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:testdb")
@AutoConfigureMockMvc
public class SecurityPatchIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private RestaurantRepository restaurantRepository;
    @Autowired private RestaurantStaffProfileRepository staffRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private DeliveryRepository deliveryRepository;
    @Autowired private JwtService jwtService;

    private Long customerId1;
    private Long customerId2;
    private Long restaurantId1;
    private Long restaurantId2;
    private Long orderId1;
    private Long orderId2;
    private Long deliveryId1;

    private String token1;
    private String token2;
    private String tokenDriver;

    @BeforeEach
    void setup() {
        deliveryRepository.deleteAll();
        orderRepository.deleteAll();
        staffRepository.deleteAll();
        restaurantRepository.deleteAll();
        customerRepository.deleteAll();

        Customer c1 = customerRepository.save(new Customer("C1", "c1@test.com", "111", "pass", "ROLE_CUSTOMER"));
        Customer c2 = customerRepository.save(new Customer("C2", "c2@test.com", "222", "pass", "ROLE_CUSTOMER"));
        Customer d1 = customerRepository.save(new Customer("D1", "d1@test.com", "333", "pass", "ROLE_DRIVER"));
        
        customerId1 = c1.getId();
        customerId2 = c2.getId();
        
        token1 = "Bearer " + jwtService.generateToken(c1.getEmail(), c1.getId());
        token2 = "Bearer " + jwtService.generateToken(c2.getEmail(), c2.getId());
        tokenDriver = "Bearer " + jwtService.generateToken(d1.getEmail(), d1.getId());

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

        Order o2 = new Order(customerId2, restaurantId2, BigDecimal.TEN);
        o2.confirm();
        orderRepository.save(o2);
        orderId2 = o2.getId();

        Delivery del1 = new Delivery(orderId1, null, null, DeliveryStatus.ASSIGNING);
        deliveryRepository.save(del1);
        deliveryId1 = del1.getId();
    }

    @Test
    void unauthenticatedReturns401() throws Exception {
        mockMvc.perform(get("/api/deliveries/" + deliveryId1))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void customerCanAccessOwnDelivery() throws Exception {
        mockMvc.perform(get("/api/deliveries/" + deliveryId1).header("Authorization", token1))
                .andExpect(status().isOk());
    }

    @Test
    void customerCannotAccessOtherDelivery() throws Exception {
        mockMvc.perform(get("/api/deliveries/" + deliveryId1).header("Authorization", token2))
                .andExpect(status().isForbidden());
    }

    @Test
    void restaurantStaffCanAccessDelivery() throws Exception {
        RestaurantStaffProfile profile = new RestaurantStaffProfile(customerId2, restaurantId1);
        profile.setApprovalStatus(StaffRequestStatus.APPROVED);
        staffRepository.save(profile);

        mockMvc.perform(get("/api/deliveries/" + deliveryId1).header("Authorization", token2))
                .andExpect(status().isOk());
    }

    @Test
    void driverCannotAccessUnassignedDelivery() throws Exception {
        mockMvc.perform(get("/api/deliveries/" + deliveryId1).header("Authorization", tokenDriver))
                .andExpect(status().isForbidden());
    }

    @Test
    void customerCannotCreateDeliveryForAnother() throws Exception {
        mockMvc.perform(post("/api/deliveries/orders/" + orderId1).header("Authorization", token2))
                .andExpect(status().isForbidden());
    }

    @Test
    void driverCannotArbitrarilyCreateDelivery() throws Exception {
        mockMvc.perform(post("/api/deliveries/orders/" + orderId2).header("Authorization", tokenDriver))
                .andExpect(status().isForbidden());
    }

    @Test
    void duplicateDeliveryCreationIsPrevented() throws Exception {
        mockMvc.perform(post("/api/deliveries/orders/" + orderId1).header("Authorization", token1))
                .andExpect(status().isConflict());
    }

    @Test
    void customerCannotAddMenuItem() throws Exception {
        mockMvc.perform(post("/api/restaurants/" + restaurantId1 + "/menu")
                .header("Authorization", token2)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Test\",\"description\":\"Desc\",\"price\":10.0,\"available\":true}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void ownerCanAddMenuItem() throws Exception {
        mockMvc.perform(post("/api/restaurants/" + restaurantId1 + "/menu")
                .header("Authorization", token1)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Test\",\"description\":\"Desc\",\"price\":10.0,\"available\":true}"))
                .andExpect(status().isCreated());
    }

    @Test
    void approvedStaffCanAddMenuItem() throws Exception {
        RestaurantStaffProfile profile = new RestaurantStaffProfile(customerId2, restaurantId1);
        profile.setApprovalStatus(StaffRequestStatus.APPROVED);
        staffRepository.save(profile);

        mockMvc.perform(post("/api/restaurants/" + restaurantId1 + "/menu")
                .header("Authorization", token2)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Test\",\"description\":\"Desc\",\"price\":10.0,\"available\":true}"))
                .andExpect(status().isCreated());
    }

    @Test
    void unapprovedStaffCannotAddMenuItem() throws Exception {
        RestaurantStaffProfile profile = new RestaurantStaffProfile(customerId2, restaurantId1);
        profile.setApprovalStatus(StaffRequestStatus.PENDING_APPROVAL);
        staffRepository.save(profile);

        mockMvc.perform(post("/api/restaurants/" + restaurantId1 + "/menu")
                .header("Authorization", token2)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Test\",\"description\":\"Desc\",\"price\":10.0,\"available\":true}"))
                .andExpect(status().isForbidden());
    }
}
