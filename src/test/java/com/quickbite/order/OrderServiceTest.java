package com.quickbite.order;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import com.quickbite.cart.CartItemRepository;
import com.quickbite.cart.CartRepository;
import com.quickbite.customer.CustomerRepository;
import com.quickbite.menu.MenuItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import com.quickbite.security.CustomUserDetails;
import java.util.Collections;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private MenuItemRepository menuItemRepository;

    @Mock
    private CustomerRepository customerRepository,
                orderEventPublisher;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
            new CustomUserDetails("test@test.com", "pass", Collections.emptyList(), 1L), null));
        OrderEventPublisher orderEventPublisher = mock(OrderEventPublisher.class);
        orderService = new OrderService(
                orderRepository,
                orderItemRepository,
                cartRepository,
                cartItemRepository,
                menuItemRepository,
                customerRepository,
                orderEventPublisher
        );
    }

    

    

    
}
