package com.quickbite;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.quickbite.customer.CustomerRepository;
import com.quickbite.customer.Customer;
import com.quickbite.restaurant.RestaurantRepository;
import com.quickbite.restaurant.RestaurantStaffProfileRepository;
import com.quickbite.restaurant.Restaurant;
import com.quickbite.restaurant.RestaurantStaffProfile;
import com.quickbite.restaurant.StaffRequestStatus;
import com.quickbite.order.OrderRepository;
import com.quickbite.order.Order;
import com.quickbite.order.OrderStatus;
import com.quickbite.menu.MenuItemRepository;
import com.quickbite.menu.MenuItem;
import com.quickbite.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import java.math.BigDecimal;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:testdb")
@AutoConfigureMockMvc
public class RestaurantDashboardIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private RestaurantRepository restaurantRepository;
    @Autowired private RestaurantStaffProfileRepository staffProfileRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private MenuItemRepository menuItemRepository;
    @Autowired private JwtService jwtService;

    private String customerToken, driverToken, applicantToken, pendingStaffToken, approvedStaffToken, ownerToken;
    private Long restaurantId, otherRestaurantId, pendingRestaurantId, orderId, otherOrderId, menuItemId;

    @BeforeEach
    void setup() {
        orderRepository.deleteAll();
        menuItemRepository.deleteAll();
        staffProfileRepository.deleteAll();
        restaurantRepository.deleteAll();
        customerRepository.deleteAll();

        Customer customer = customerRepository.save(new Customer("Cust", "cust@test.com", "111", "pass", "ROLE_CUSTOMER"));
        Customer driver = customerRepository.save(new Customer("Driver", "driver@test.com", "222", "pass", "ROLE_DRIVER"));
        Customer applicant = customerRepository.save(new Customer("App", "app@test.com", "333", "pass", "ROLE_CUSTOMER"));
        Customer pendingStaff = customerRepository.save(new Customer("PStaff", "pstaff@test.com", "444", "pass", "ROLE_CUSTOMER"));
        Customer approvedStaff = customerRepository.save(new Customer("AStaff", "astaff@test.com", "555", "pass", "ROLE_CUSTOMER"));
        Customer owner = customerRepository.save(new Customer("Owner", "owner@test.com", "666", "pass", "ROLE_CUSTOMER"));
        Customer otherOwner = customerRepository.save(new Customer("OtherOwner", "other@test.com", "777", "pass", "ROLE_CUSTOMER"));

        customerToken = "Bearer " + jwtService.generateToken(customer.getEmail(), customer.getId());
        driverToken = "Bearer " + jwtService.generateToken(driver.getEmail(), driver.getId());
        applicantToken = "Bearer " + jwtService.generateToken(applicant.getEmail(), applicant.getId());
        pendingStaffToken = "Bearer " + jwtService.generateToken(pendingStaff.getEmail(), pendingStaff.getId());
        approvedStaffToken = "Bearer " + jwtService.generateToken(approvedStaff.getEmail(), approvedStaff.getId());
        ownerToken = "Bearer " + jwtService.generateToken(owner.getEmail(), owner.getId());

        Restaurant restaurant = new Restaurant("My Rest", "C", "L", 5.0);
        restaurant.setStatus(com.quickbite.restaurant.RestaurantStatus.APPROVED);
        restaurant.setOwnerId(owner.getId());
        restaurantId = restaurantRepository.save(restaurant).getId();

        Restaurant pendingRest = new Restaurant("Pending", "C", "L", 5.0);
        pendingRest.setStatus(com.quickbite.restaurant.RestaurantStatus.PENDING_APPROVAL);
        pendingRest.setOwnerId(applicant.getId());
        pendingRestaurantId = restaurantRepository.save(pendingRest).getId();

        Restaurant otherRest = new Restaurant("Other Rest", "C", "L", 5.0);
        otherRest.setStatus(com.quickbite.restaurant.RestaurantStatus.APPROVED);
        otherRest.setOwnerId(otherOwner.getId());
        otherRestaurantId = restaurantRepository.save(otherRest).getId();

        RestaurantStaffProfile p1 = new RestaurantStaffProfile(pendingStaff.getId(), restaurantId);
        p1.setApprovalStatus(StaffRequestStatus.PENDING_APPROVAL);
        staffProfileRepository.save(p1);

        RestaurantStaffProfile p2 = new RestaurantStaffProfile(approvedStaff.getId(), restaurantId);
        p2.setApprovalStatus(StaffRequestStatus.APPROVED);
        staffProfileRepository.save(p2);

        Order order = new Order(customer.getId(), restaurantId, new BigDecimal("10.00"));
        orderId = orderRepository.save(order).getId();

        Order otherOrder = new Order(customer.getId(), otherRestaurantId, new BigDecimal("20.00"));
        otherOrderId = orderRepository.save(otherOrder).getId();

        MenuItem item = new MenuItem(restaurantId, "Item", "Desc", new BigDecimal("5.00"), true);
        menuItemId = menuItemRepository.save(item).getId();
    }

    @Test void t01_unauthenticatedReturns401() throws Exception {
        mockMvc.perform(get("/api/restaurants/" + restaurantId + "/dashboard-summary")).andExpect(status().isUnauthorized());
    }
    @Test void t02_customerReceives403() throws Exception {
        mockMvc.perform(get("/api/restaurants/" + restaurantId + "/dashboard-summary").header("Authorization", customerToken)).andExpect(status().isForbidden());
    }
    @Test void t03_driverReceives403() throws Exception {
        mockMvc.perform(get("/api/restaurants/" + restaurantId + "/dashboard-summary").header("Authorization", driverToken)).andExpect(status().isForbidden());
    }
    @Test void t04_applicantReceives403() throws Exception {
        mockMvc.perform(get("/api/restaurants/" + restaurantId + "/dashboard-summary").header("Authorization", applicantToken)).andExpect(status().isForbidden());
    }
    @Test void t05_pendingStaffReceives403() throws Exception {
        mockMvc.perform(get("/api/restaurants/" + restaurantId + "/dashboard-summary").header("Authorization", pendingStaffToken)).andExpect(status().isForbidden());
    }
    @Test void t06_approvedStaffCanAccess() throws Exception {
        mockMvc.perform(get("/api/restaurants/" + restaurantId + "/dashboard-summary").header("Authorization", approvedStaffToken)).andExpect(status().isOk());
    }
    @Test void t07_ownerCanAccess() throws Exception {
        mockMvc.perform(get("/api/restaurants/" + restaurantId + "/dashboard-summary").header("Authorization", ownerToken)).andExpect(status().isOk());
    }
    @Test void t08_userCannotAccessAnotherRestaurant() throws Exception {
        mockMvc.perform(get("/api/restaurants/" + otherRestaurantId + "/dashboard-summary").header("Authorization", ownerToken)).andExpect(status().isForbidden());
    }
    @Test void t09_cannotReadAnotherRestaurantOrder() throws Exception {
        mockMvc.perform(get("/api/restaurants/" + restaurantId + "/orders/" + otherOrderId).header("Authorization", ownerToken)).andExpect(status().isNotFound());
    }
    @Test void t10_cannotUpdateAnotherRestaurantOrder() throws Exception {
        mockMvc.perform(patch("/api/restaurants/" + restaurantId + "/orders/" + otherOrderId + "/status")
                .header("Authorization", ownerToken).contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"CONFIRMED\"}")).andExpect(status().isNotFound());
    }
    @Test void t11_ownerCanUpdateOrder() throws Exception {
        mockMvc.perform(patch("/api/restaurants/" + restaurantId + "/orders/" + orderId + "/status")
                .header("Authorization", ownerToken).contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"CONFIRMED\"}")).andExpect(status().isOk());
    }
    @Test void t12_approvedStaffCanUpdateOrder() throws Exception {
        mockMvc.perform(patch("/api/restaurants/" + restaurantId + "/orders/" + orderId + "/status")
                .header("Authorization", approvedStaffToken).contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"PREPARING\"}")).andExpect(status().isOk());
    }
    @Test void t13_pendingRestaurantCannotModifyMenu() throws Exception {
        mockMvc.perform(post("/api/restaurants/" + pendingRestaurantId + "/menu").header("Authorization", applicantToken).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"N\",\"description\":\"D\",\"price\":1,\"available\":true}")).andExpect(status().isForbidden());
    }
    @Test void t14_ownerCanUpdateMenuItem() throws Exception {
        mockMvc.perform(put("/api/restaurants/" + restaurantId + "/menu/" + menuItemId).header("Authorization", ownerToken).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"NewN\",\"description\":\"D\",\"price\":10,\"available\":false}")).andExpect(status().isOk());
    }
    @Test void t15_approvedStaffCanUpdateMenuItem() throws Exception {
        mockMvc.perform(put("/api/restaurants/" + restaurantId + "/menu/" + menuItemId).header("Authorization", approvedStaffToken).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"NewN\",\"description\":\"D\",\"price\":10,\"available\":false}")).andExpect(status().isOk());
    }
    @Test void t16_cannotUpdateOtherRestaurantMenu() throws Exception {
        mockMvc.perform(put("/api/restaurants/" + otherRestaurantId + "/menu/" + menuItemId).header("Authorization", ownerToken).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"NewN\",\"description\":\"D\",\"price\":10,\"available\":false}")).andExpect(status().isForbidden());
    }
    @Test void t17_invalidMenuInputReturnsStandardResponse() throws Exception {
        mockMvc.perform(put("/api/restaurants/" + restaurantId + "/menu/" + menuItemId).header("Authorization", ownerToken).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"\",\"description\":\"D\",\"price\":10,\"available\":false}")).andExpect(status().isBadRequest());
    }
    @Test void t18_invalidOrderStatusTransitionsAreRejected() throws Exception {
        // Since CANCELLED -> anything is forbidden if not pending
        Order order = orderRepository.findById(orderId).get();
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);
        mockMvc.perform(patch("/api/restaurants/" + restaurantId + "/orders/" + orderId + "/status").header("Authorization", ownerToken).contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"CANCELLED\"}")).andExpect(status().isConflict());
    }
}
