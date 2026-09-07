package com.quickbite.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickbite.customer.Customer;
import com.quickbite.customer.CustomerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testSignupSuccess() throws Exception {
        SignupRequest request = new SignupRequest("Test User", "testnew@example.com", "password123");
        
        mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token", notNullValue()));

        assertTrue(customerRepository.existsByEmail("testnew@example.com"));
    }

    @Test
    void testSignupDuplicateEmail() throws Exception {
        Customer c = new Customer("Existing", "testdup@example.com", null, passwordEncoder.encode("password123"));
        customerRepository.save(c);

        SignupRequest request = new SignupRequest("Test User", "testdup@example.com", "newpass");
        mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void testLoginSuccess() throws Exception {
        Customer c = new Customer("Login User", "login@example.com", null, passwordEncoder.encode("secret"));
        customerRepository.save(c);

        AuthRequest request = new AuthRequest("login@example.com", "secret");
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()));
    }

    @Test
    void testLoginInvalidPassword() throws Exception {
        Customer c = new Customer("Login User", "loginwrong@example.com", null, passwordEncoder.encode("secret"));
        customerRepository.save(c);

        AuthRequest request = new AuthRequest("loginwrong@example.com", "wrongpass");
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testProtectedEndpointWithoutJwt() throws Exception {
        // carts endpoints are protected and not listed in permitAll
        mockMvc.perform(post("/api/carts")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"customerId\":1, \"restaurantId\":1}"))
                .andExpect(status().isForbidden()); // or isUnauthorized 
    }

    @Test
    void testProtectedEndpointWithValidJwt() throws Exception {
        Customer c = new Customer("Login User", "validjwt@example.com", null, passwordEncoder.encode("secret"));
        c = customerRepository.save(c);

        AuthRequest request = new AuthRequest("validjwt@example.com", "secret");
        String responseBody = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andReturn().getResponse().getContentAsString();

        String token = objectMapper.readTree(responseBody).get("token").asText();

        mockMvc.perform(post("/api/carts")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"customerId\":" + c.getId() + ", \"restaurantId\":1}"))
                .andExpect(status().isCreated());
    }
}
