package com.quickbite.delivery;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetailsService;

import com.quickbite.order.Order;
import com.quickbite.order.OrderRepository;
import com.quickbite.security.CustomUserDetails;
import com.quickbite.security.JwtService;

class WebSocketSecurityInterceptorTest {

    private JwtService jwtService;
    private UserDetailsService userDetailsService;
    private OrderRepository orderRepository;
    private DeliveryRepository deliveryRepository;
    private ChannelInterceptor interceptor;

    @BeforeEach
    void setUp() {
        jwtService = mock(JwtService.class);
        userDetailsService = mock(UserDetailsService.class);
        orderRepository = mock(OrderRepository.class);
        deliveryRepository = mock(DeliveryRepository.class);

        WebSocketConfig config = new WebSocketConfig(jwtService, userDetailsService, orderRepository, deliveryRepository);
        interceptor = config.stompSecurityInterceptor();
    }

    @Test
    void rejectsSendCommand() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SEND);
        Message<?> message = org.springframework.messaging.support.MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> 
            interceptor.preSend(message, null)
        );
        assertEquals("Clients cannot publish messages", ex.getMessage());
    }

    @Test
    void allowsValidSubscription() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/deliveries/100");
        
        CustomUserDetails user = new CustomUserDetails("test@test.com", "password", java.util.Collections.emptyList(), 1L);
        Authentication auth = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
        accessor.setUser(auth);

        Message<?> message = org.springframework.messaging.support.MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Delivery delivery = new Delivery(500L, null, null, DeliveryStatus.ASSIGNING);
        Order order = new Order(1L, 500L, BigDecimal.TEN);

        when(deliveryRepository.findById(100L)).thenReturn(Optional.of(delivery));
        when(orderRepository.findById(500L)).thenReturn(Optional.of(order));

        assertDoesNotThrow(() -> interceptor.preSend(message, null));
    }

    @Test
    void rejectsSubscriptionToOtherCustomersDelivery() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/deliveries/100");
        
        // Subscriber is customer 1
        CustomUserDetails user = new CustomUserDetails("test@test.com", "password", java.util.Collections.emptyList(), 1L);
        Authentication auth = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
        accessor.setUser(auth);

        Message<?> message = org.springframework.messaging.support.MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Delivery delivery = new Delivery(500L, null, null, DeliveryStatus.ASSIGNING);
        // Delivery belongs to customer 2
        Order order = new Order(2L, 500L, BigDecimal.TEN);

        when(deliveryRepository.findById(100L)).thenReturn(Optional.of(delivery));
        when(orderRepository.findById(500L)).thenReturn(Optional.of(order));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> 
            interceptor.preSend(message, null)
        );
        assertEquals("Invalid subscription destination: Unauthorized to subscribe to this delivery", ex.getMessage());
    }
}
