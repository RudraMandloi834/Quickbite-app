package com.quickbite.delivery;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:testdb")
@AutoConfigureMockMvc
public class DeliverySecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(username = "customer@test.com", authorities = {"ROLE_CUSTOMER"})
    void customerCannotAssignDelivery() throws Exception {
        mockMvc.perform(post("/api/deliveries/1/assign"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "customer@test.com", authorities = {"ROLE_CUSTOMER"})
    void customerCannotUpdateDeliveryStatus() throws Exception {
        mockMvc.perform(patch("/api/deliveries/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PICKED_UP\"}"))
                .andExpect(status().isForbidden());
    }
}
