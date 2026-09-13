package com.quickbite.restaurant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.quickbite.customer.Customer;
import com.quickbite.customer.CustomerRepository;
import com.quickbite.security.JwtService;

import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RestaurantOnboardingTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private RestaurantStaffProfileRepository staffProfileRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private JwtService jwtService;

    private String user1Token;
    private Long user1Id;

    private String user2Token;
    private Long user2Id;

    @BeforeEach
    void setup() {
        // staffProfileRepository.deleteAll();
        // restaurantRepository.deleteAll();
        // customerRepository.deleteAll();

        Customer user1 = new Customer("User One", "user1@test.com", "123", "pass", "ROLE_CUSTOMER");
        user1 = customerRepository.save(user1);
        user1Id = user1.getId();
        user1Token = "Bearer " + jwtService.generateToken(user1.getEmail(), user1Id);

        Customer user2 = new Customer("User Two", "user2@test.com", "456", "pass", "ROLE_CUSTOMER");
        user2 = customerRepository.save(user2);
        user2Id = user2.getId();
        user2Token = "Bearer " + jwtService.generateToken(user2.getEmail(), user2Id);
    }

    @Test
    void testNewApplicationCreatesPendingApprovalAndAssignsOwner() throws Exception {
        CreateRestaurantRequest request = new CreateRestaurantRequest("New Rest", "Italian", "Loc", 0.0, "Addr", "City", "Area", 0.0, 0.0, "9-5", 5.0, "url");

        String res = mockMvc.perform(post("/api/restaurants/apply")
                .header("Authorization", user1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Restaurant created = objectMapper.readValue(res, Restaurant.class);
        assertThat(created.getStatus()).isEqualTo(RestaurantStatus.PENDING_APPROVAL);
        assertThat(created.getOwnerId()).isEqualTo(user1Id);

        // Verify it doesn't accept ownerId from client (client doesn't send it, but even if they did, the DTO doesn't map it)
    }

    @Test
    void testStaffRequestLinksUserAndPreventsDuplicates() throws Exception {
        // Create an existing restaurant (using service method for test directly)
        Restaurant rest = new Restaurant("Exist", "Mexican", "Loc", 4.0);
        rest.setStatus(RestaurantStatus.APPROVED);
        rest = restaurantRepository.save(rest);

        // User1 requests staff access
        mockMvc.perform(post("/api/restaurants/" + rest.getId() + "/staff-requests")
                .header("Authorization", user1Token))
                .andExpect(status().isCreated());

        // Duplicate request should fail
        mockMvc.perform(post("/api/restaurants/" + rest.getId() + "/staff-requests")
                .header("Authorization", user1Token))
                .andExpect(status().isConflict());

        List<RestaurantStaffProfile> profiles = staffProfileRepository.findByUserId(user1Id);
        assertThat(profiles).hasSize(1);
        assertThat(profiles.get(0).getRestaurantId()).isEqualTo(rest.getId());
        assertThat(profiles.get(0).getApprovalStatus()).isEqualTo(StaffRequestStatus.PENDING_APPROVAL);
    }

    @Test
    void testUserCanOnlySeeOwnApplications() throws Exception {
        CreateRestaurantRequest req1 = new CreateRestaurantRequest("R1", "C", "L", 0.0, "", "", "", 0.0, 0.0, "", 0.0, "");
        mockMvc.perform(post("/api/restaurants/apply")
                .header("Authorization", user1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        String res = mockMvc.perform(get("/api/restaurants/my-applications")
                .header("Authorization", user1Token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        List<Restaurant> list = objectMapper.readValue(res, new TypeReference<List<Restaurant>>() {});
        assertThat(list).hasSize(1);
        assertThat(list.get(0).getName()).isEqualTo("R1");

        String res2 = mockMvc.perform(get("/api/restaurants/my-applications")
                .header("Authorization", user2Token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        List<Restaurant> list2 = objectMapper.readValue(res2, new TypeReference<List<Restaurant>>() {});
        assertThat(list2).isEmpty();
    }

    @Test
    void testNonApprovedRestaurantsAreHiddenFromListing() throws Exception {
        Restaurant approved = new Restaurant("ApprovedRest", "C", "L", 0.0);
        approved.setStatus(RestaurantStatus.APPROVED);
        restaurantRepository.save(approved);

        Restaurant pending = new Restaurant("PendingRest", "C", "L", 0.0);
        pending.setStatus(RestaurantStatus.PENDING_APPROVAL);
        restaurantRepository.save(pending);

        String res = mockMvc.perform(get("/api/restaurants"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        List<Restaurant> list = objectMapper.readValue(res, new TypeReference<List<Restaurant>>() {});
        boolean foundApproved = list.stream().anyMatch(r -> "ApprovedRest".equals(r.getName()));
        boolean foundPending = list.stream().anyMatch(r -> "PendingRest".equals(r.getName()));
        
        assertThat(foundApproved).isTrue();
        assertThat(foundPending).isFalse();
    }

    @Test
    void testExistingRestaurantsRemainVisible() throws Exception {
        Restaurant legacy = new Restaurant("LegacyRest", "C", "L", 0.0);
        restaurantRepository.save(legacy);

        String res = mockMvc.perform(get("/api/restaurants"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        List<Restaurant> list = objectMapper.readValue(res, new TypeReference<List<Restaurant>>() {});
        boolean foundLegacy = list.stream().anyMatch(r -> "LegacyRest".equals(r.getName()));
        assertThat(foundLegacy).isTrue();
    }
}
