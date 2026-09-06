package com.quickbite.restaurant;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class RestaurantNearbyTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testNearbyRestaurantsValidRequest() throws Exception {
        // Assume database has restaurants, test Mumbai coordinates
        mockMvc.perform(get("/api/restaurants/nearby")
                .param("latitude", "19.0760")
                .param("longitude", "72.8777")
                .param("radiusKm", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testNearbyRestaurantsInvalidLatitude() throws Exception {
        mockMvc.perform(get("/api/restaurants/nearby")
                .param("latitude", "100.0") // Invalid
                .param("longitude", "72.8777")
                .param("radiusKm", "10"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testNearbyRestaurantsInvalidLongitude() throws Exception {
        mockMvc.perform(get("/api/restaurants/nearby")
                .param("latitude", "19.0760")
                .param("longitude", "200.0") // Invalid
                .param("radiusKm", "10"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testNearbyRestaurantsInvalidRadius() throws Exception {
        mockMvc.perform(get("/api/restaurants/nearby")
                .param("latitude", "19.0760")
                .param("longitude", "72.8777")
                .param("radiusKm", "-5")) // Invalid
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void testNearbyRestaurantsMissingParams() throws Exception {
        mockMvc.perform(get("/api/restaurants/nearby")
                .param("latitude", "19.0760")
                .param("radiusKm", "10"))
                .andExpect(status().isBadRequest());
    }
}
