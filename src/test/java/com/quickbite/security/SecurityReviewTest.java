package com.quickbite.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickbite.customer.Customer;
import com.quickbite.customer.CustomerRepository;
import com.quickbite.cart.Cart;
import com.quickbite.cart.CartRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class SecurityReviewTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CustomerRepository customerRepository;
    
    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Test
    void restaurantMutationsNotPublic() throws Exception {
        // POST to /api/restaurants should be 403 Forbidden (since no token)
        mockMvc.perform(post("/api/restaurants")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Hacker Restaurant\"}"))
                .andExpect(status().is4xxClientError()); // Spring Security without auth returns 403 by default on some configurations, or 401 if AuthenticationEntryPoint is set. Let's just expect 4xx
    }

    @Test
    void cannotAccessAnotherCustomersCart() throws Exception {
        Customer customerA = customerRepository.save(new Customer("Customer A", "a@example.com", "111", passwordEncoder.encode("pass")));
        Cart cartA = cartRepository.save(new Cart(customerA.getId(), 1L));

        Customer customerB = customerRepository.save(new Customer("Customer B", "b@example.com", "222", passwordEncoder.encode("pass")));
        String tokenB = jwtService.generateToken(customerB.getEmail(), customerB.getId());

        mockMvc.perform(get("/api/carts/" + cartA.getId())
                .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().is4xxClientError());
    }
}
