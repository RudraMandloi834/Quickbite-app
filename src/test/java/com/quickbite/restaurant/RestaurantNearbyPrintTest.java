package com.quickbite.restaurant;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

@SpringBootTest
@AutoConfigureMockMvc
public class RestaurantNearbyPrintTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void printExampleResponse() throws Exception {
        String response = mockMvc.perform(get("/api/restaurants/nearby")
                .param("latitude", "19.0760")
                .param("longitude", "72.8777")
                .param("radiusKm", "1"))
                .andReturn().getResponse().getContentAsString();
        System.out.println("RESPONSE_START");
        System.out.println(response);
        System.out.println("RESPONSE_END");
    }
}
