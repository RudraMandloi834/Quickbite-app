package com.quickbite.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class RestaurantSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void unauthenticatedPostIsRejected() throws Exception {
        mockMvc.perform(post("/api/restaurants")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Test\", \"cuisine\":\"Test\", \"location\":\"Test\", \"rating\":4.0}"))
               .andExpect(status().isForbidden()); // Or isForbidden? Let's check status().is4xxClientError() first
    }
}
