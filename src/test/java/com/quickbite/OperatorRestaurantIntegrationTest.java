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
import com.quickbite.restaurant.Restaurant;
import com.quickbite.security.JwtService;
import org.junit.jupiter.api.BeforeEach;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:testdb")
@AutoConfigureMockMvc
public class OperatorRestaurantIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private RestaurantRepository restaurantRepository;
    @Autowired private JwtService jwtService;

    private String customerToken;
    private String driverToken;
    private String operatorToken;
    
    private Long pendingRestaurantId;
    private Long approvedRestaurantId;

    @BeforeEach
    void setup() {
        restaurantRepository.deleteAll();
        customerRepository.deleteAll();

        Customer customer = customerRepository.save(new Customer("Cust", "cust@test.com", "111", "pass", "ROLE_CUSTOMER"));
        Customer driver = customerRepository.save(new Customer("Driver", "driver@test.com", "222", "pass", "ROLE_DRIVER"));
        Customer operator = customerRepository.save(new Customer("Op", "op@test.com", "333", "pass", "ROLE_OPERATOR"));

        customerToken = "Bearer " + jwtService.generateToken(customer.getEmail(), customer.getId());
        driverToken = "Bearer " + jwtService.generateToken(driver.getEmail(), driver.getId());
        operatorToken = "Bearer " + jwtService.generateToken(operator.getEmail(), operator.getId());

        Restaurant pending = new Restaurant("Pending", "Cuisine", "Loc", 5.0, "Addr", "City", "Area", 0.0, 0.0, "Hours", 5.0, "img");
        pending.setStatus(com.quickbite.restaurant.RestaurantStatus.PENDING_APPROVAL);
        pending = restaurantRepository.save(pending);
        pendingRestaurantId = pending.getId();

        Restaurant approved = new Restaurant("Approved", "Cuisine", "Loc", 5.0, "Addr", "City", "Area", 0.0, 0.0, "Hours", 5.0, "img");
        approved.setStatus(com.quickbite.restaurant.RestaurantStatus.APPROVED);
        approved = restaurantRepository.save(approved);
        approvedRestaurantId = approved.getId();
    }

    @Test
    void unauthenticatedCannotAccessPendingList() throws Exception {
        mockMvc.perform(get("/api/operator/restaurants/pending"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void customerCannotAccessPendingList() throws Exception {
        mockMvc.perform(get("/api/operator/restaurants/pending").header("Authorization", customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void driverCannotAccessPendingList() throws Exception {
        mockMvc.perform(get("/api/operator/restaurants/pending").header("Authorization", driverToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void operatorCanListPendingApplications() throws Exception {
        mockMvc.perform(get("/api/operator/restaurants/pending").header("Authorization", operatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(pendingRestaurantId))
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void operatorCanApprovePendingRestaurant() throws Exception {
        mockMvc.perform(post("/api/operator/restaurants/" + pendingRestaurantId + "/approve")
                .header("Authorization", operatorToken))
                .andExpect(status().isOk());
                
        Restaurant r = restaurantRepository.findById(pendingRestaurantId).get();
        org.junit.jupiter.api.Assertions.assertEquals(com.quickbite.restaurant.RestaurantStatus.APPROVED, r.getStatus());
        org.junit.jupiter.api.Assertions.assertNotNull(r.getReviewedBy());
        org.junit.jupiter.api.Assertions.assertNotNull(r.getReviewedAt());
    }

    @Test
    void operatorCanRejectPendingRestaurant() throws Exception {
        mockMvc.perform(post("/api/operator/restaurants/" + pendingRestaurantId + "/reject")
                .header("Authorization", operatorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\":\"Incomplete address\"}"))
                .andExpect(status().isOk());
                
        Restaurant r = restaurantRepository.findById(pendingRestaurantId).get();
        org.junit.jupiter.api.Assertions.assertEquals(com.quickbite.restaurant.RestaurantStatus.REJECTED, r.getStatus());
        org.junit.jupiter.api.Assertions.assertNotNull(r.getReviewedBy());
        org.junit.jupiter.api.Assertions.assertNotNull(r.getReviewedAt());
        org.junit.jupiter.api.Assertions.assertEquals("Incomplete address", r.getRejectionReason());
    }

    @Test
    void nonPendingRestaurantCannotBeApproved() throws Exception {
        mockMvc.perform(post("/api/operator/restaurants/" + approvedRestaurantId + "/approve")
                .header("Authorization", operatorToken))
                .andExpect(status().isConflict());
    }

    @Test
    void duplicateApprovalIsPrevented() throws Exception {
        mockMvc.perform(post("/api/operator/restaurants/" + pendingRestaurantId + "/approve")
                .header("Authorization", operatorToken))
                .andExpect(status().isOk());
                
        mockMvc.perform(post("/api/operator/restaurants/" + pendingRestaurantId + "/approve")
                .header("Authorization", operatorToken))
                .andExpect(status().isConflict());
    }

    @Test
    void approvedRestaurantsRemainPubliclyVisible() throws Exception {
        mockMvc.perform(get("/api/restaurants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(approvedRestaurantId));
    }

    @Test
    void pendingRestaurantsRemainHiddenFromPublicListing() throws Exception {
        mockMvc.perform(get("/api/restaurants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + pendingRestaurantId + ")]").doesNotExist());
    }

    @Test
    void restaurantUserCannotAccessPendingList() throws Exception {
        Long id = restaurantRepository.findAll().stream().filter(r -> r.getStatus() == com.quickbite.restaurant.RestaurantStatus.PENDING_APPROVAL).findFirst().get().getId();
        Restaurant r = restaurantRepository.findById(id).get();
        Customer owner = customerRepository.findById(r.getOwnerId() != null ? r.getOwnerId() : 1L).orElseGet(() -> customerRepository.findAll().get(0));
        String token = "Bearer " + jwtService.generateToken(owner.getEmail(), owner.getId());
        
        mockMvc.perform(get("/api/operator/restaurants/pending").header("Authorization", token))
                .andExpect(status().isForbidden());
    }

    @Test
    void rejectedRestaurantsRemainHiddenFromPublicListing() throws Exception {
        Restaurant rejected = new Restaurant("Rejected", "Cuisine", "Loc", 5.0, "Addr", "City", "Area", 0.0, 0.0, "Hours", 5.0, "img");
        rejected.setStatus(com.quickbite.restaurant.RestaurantStatus.REJECTED);
        rejected = restaurantRepository.save(rejected);
        
        mockMvc.perform(get("/api/restaurants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + rejected.getId() + ")]").doesNotExist());
    }
}
