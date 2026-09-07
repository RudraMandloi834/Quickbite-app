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
    private CustomerRepository customerRepository;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
            new CustomUserDetails("test@test.com", "pass", Collections.emptyList(), 1L), null));
        orderService = new OrderService(
                orderRepository,
                orderItemRepository,
                cartRepository,
                cartItemRepository,
                menuItemRepository,
                customerRepository
        );
    }

    @Test
    void cancelsExistingPendingOrder() {
        Order order = new Order(1L, 1L, BigDecimal.valueOf(100));
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        Order cancelledOrder = orderService.cancelOrder(1L);

        assertEquals(OrderStatus.CANCELLED, cancelledOrder.getStatus());
        verify(orderRepository).save(order);
    }

    @Test
    void returnsNotFoundForMissingOrder() {
        when(orderRepository.findById(99L)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> orderService.cancelOrder(99L)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    @Test
    void returnsConflictForConfirmedOrCancelledOrder() {
        Order confirmedOrder = mock(Order.class);
        when(confirmedOrder.getStatus()).thenReturn(OrderStatus.CONFIRMED);
        when(confirmedOrder.getCustomerId()).thenReturn(1L);
        when(orderRepository.findById(2L)).thenReturn(Optional.of(confirmedOrder));

        ResponseStatusException confirmedException = assertThrows(
                ResponseStatusException.class,
                () -> orderService.cancelOrder(2L)
        );

        assertEquals(HttpStatus.CONFLICT, confirmedException.getStatusCode());

        Order cancelledOrder = mock(Order.class);
        when(cancelledOrder.getStatus()).thenReturn(OrderStatus.CANCELLED);
        when(cancelledOrder.getCustomerId()).thenReturn(1L);
        when(orderRepository.findById(3L)).thenReturn(Optional.of(cancelledOrder));

        ResponseStatusException cancelledException = assertThrows(
                ResponseStatusException.class,
                () -> orderService.cancelOrder(3L)
        );

        assertEquals(HttpStatus.CONFLICT, cancelledException.getStatusCode());
    }
}
