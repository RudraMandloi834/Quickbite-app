package com.quickbite.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickbite.customer.Customer;
import com.quickbite.customer.CustomerRepository;
import com.quickbite.menu.MenuItem;
import com.quickbite.menu.MenuItemRepository;
import com.quickbite.order.Order;
import com.quickbite.order.OrderRepository;
import com.quickbite.order.OrderStatus;
import com.quickbite.order.UpdateOrderStatusRequest;
import com.quickbite.restaurant.Restaurant;
import com.quickbite.restaurant.RestaurantRepository;
import com.quickbite.restaurant.RestaurantStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class RoleBasedAuthenticationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TestAccountProvisioningService provisioningService;

    @BeforeEach
    void setUp() {
        provisioningService.provisionTestAccounts("dev123");
    }

    private String loginAndGetToken(String email, String password) throws Exception {
        AuthRequest req = new AuthRequest(email, password);
        String res = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(res).get("token").asText();
    }

    @Test
    void testAllFourRolesLoginSuccessfullyWithDev123() throws Exception {
        // 1. Customer
        String custToken = loginAndGetToken("customer@test.com", "dev123");
        assertNotEquals("", custToken);

        // 2. Restaurant Owner
        String restToken = loginAndGetToken("restaurant@test.com", "dev123");
        assertNotEquals("", restToken);

        // 3. Driver
        String driverToken = loginAndGetToken("driver@test.com", "dev123");
        assertNotEquals("", driverToken);

        // 4. Admin / Operator
        String adminToken = loginAndGetToken("admin@test.com", "dev123");
        assertNotEquals("", adminToken);
    }

    @Test
    void testCaseInsensitiveAndTrimmedLogin() throws Exception {
        // Mixed case and leading/trailing spaces
        String token = loginAndGetToken("  CuStOmEr@TeSt.CoM  ", "dev123");
        assertNotEquals("", token);
    }

    @Test
    void testPublicSignupCannotGrantAdminPrivileges() throws Exception {
        SignupRequest req = new SignupRequest("Attacker", "hacker@test.com", "secretpass", "ROLE_OPERATOR");
        mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token", notNullValue()));

        Customer registered = customerRepository.findByEmail("hacker@test.com").orElseThrow();
        assertEquals("ROLE_CUSTOMER", registered.getRole(), "Public signup requesting ROLE_OPERATOR must be demoted to ROLE_CUSTOMER");
    }

    @Test
    void testAdminEndpointsAccessControl() throws Exception {
        String adminToken = loginAndGetToken("admin@test.com", "dev123");
        String custToken = loginAndGetToken("customer@test.com", "dev123");
        String driverToken = loginAndGetToken("driver@test.com", "dev123");

        // Admin can access /api/admin/stats and /api/admin/users
        mockMvc.perform(get("/api/admin/stats")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/users")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Customer forbidden
        mockMvc.perform(get("/api/admin/stats")
                .header("Authorization", "Bearer " + custToken))
                .andExpect(status().isForbidden());

        // Driver forbidden
        mockMvc.perform(get("/api/admin/stats")
                .header("Authorization", "Bearer " + driverToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testRestaurantOwnerCannotModifyAnotherRestaurantOrder() throws Exception {
        Customer partner1 = customerRepository.findByEmail("restaurant@test.com").orElseThrow();
        Restaurant rest1 = restaurantRepository.findByOwnerId(partner1.getId()).get(0);

        // Create partner 2 with restaurant 2
        Customer partner2 = customerRepository.save(new Customer("Partner 2", "partner2@test.com", "123", passwordEncoder.encode("dev123"), "ROLE_RESTAURANT_PARTNER"));
        Restaurant rest2 = new Restaurant("Rest 2", "Italian", "Loc", 4.0, "Addr", "City", "City", 0.0, 0.0, "10-10", 10.0, "img");
        rest2.setOwnerId(partner2.getId());
        rest2.setStatus(RestaurantStatus.APPROVED);
        rest2 = restaurantRepository.save(rest2);

        // Order placed at rest 2
        Customer cust = customerRepository.findByEmail("customer@test.com").orElseThrow();
        Order order = new Order(cust.getId(), rest2.getId(), BigDecimal.valueOf(500));
        order = orderRepository.save(order);

        // Partner 1 tries to access / update rest 2's order
        String partner1Token = loginAndGetToken("restaurant@test.com", "dev123");

        mockMvc.perform(get("/api/restaurants/" + rest2.getId() + "/orders")
                .header("Authorization", "Bearer " + partner1Token))
                .andExpect(status().isForbidden());

        UpdateOrderStatusRequest updateReq = new UpdateOrderStatusRequest(OrderStatus.ACCEPTED);
        mockMvc.perform(patch("/api/restaurants/" + rest2.getId() + "/orders/" + order.getId() + "/status")
                .header("Authorization", "Bearer " + partner1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());

        // Partner 2 CAN access their own restaurant's orders
        String partner2Token = loginAndGetToken("partner2@test.com", "dev123");
        mockMvc.perform(get("/api/restaurants/" + rest2.getId() + "/orders")
                .header("Authorization", "Bearer " + partner2Token))
                .andExpect(status().isOk());
    }

    @Test
    void testDriverEndpointsAccessControl() throws Exception {
        String driverToken = loginAndGetToken("driver@test.com", "dev123");
        String custToken = loginAndGetToken("customer@test.com", "dev123");

        // Driver can view available deliveries
        mockMvc.perform(get("/api/deliveries/available")
                .header("Authorization", "Bearer " + driverToken))
                .andExpect(status().isOk());

        // Customer cannot access available deliveries
        mockMvc.perform(get("/api/deliveries/available")
                .header("Authorization", "Bearer " + custToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testSetupAdminEndpointFailsWhenAdminAlreadyExists() throws Exception {
        // Admin already seeded in setUp()
        AuthController.SetupAdminRequest req = new AuthController.SetupAdminRequest("New Admin", "newadmin@test.com", "pass123");
        mockMvc.perform(post("/api/auth/setup-admin")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict());
    }
}
