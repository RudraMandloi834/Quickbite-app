package com.quickbite.delivery;

import com.quickbite.security.JwtService;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import com.quickbite.security.CustomUserDetails;
import org.springframework.security.core.Authentication;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final com.quickbite.order.OrderRepository orderRepository;
    private final DeliveryRepository deliveryRepository;

    public WebSocketConfig(JwtService jwtService, UserDetailsService userDetailsService,
                           com.quickbite.order.OrderRepository orderRepository,
                           DeliveryRepository deliveryRepository) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.orderRepository = orderRepository;
        this.deliveryRepository = deliveryRepository;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/user", "/topic");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompSecurityInterceptor());
    }

    public ChannelInterceptor stompSecurityInterceptor() {
        return new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null) return message;

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        try {
                            String username = jwtService.extractUsername(token);
                            if (username != null) {
                                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                                if (jwtService.isTokenValid(token, userDetails.getUsername())) {
                                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                            userDetails, null, userDetails.getAuthorities());
                                    
                                    accessor.setUser(authentication);
                                    return message;
                                } else {
                                    throw new IllegalArgumentException("Invalid JWT token");
                                }
                            }
                        } catch (Exception e) {
                            throw new IllegalArgumentException("Failed to authenticate STOMP connection: " + e.getMessage());
                        }
                    } else {
                        throw new IllegalArgumentException("Missing or invalid Authorization header");
                    }
                } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    String destination = accessor.getDestination();
                    if (destination != null) {
                        if (destination.equals("/topic/deliveries")) {
                            Authentication auth = (Authentication) accessor.getUser();
                            if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails)) {
                                throw new IllegalArgumentException("Unauthenticated");
                            }
                            CustomUserDetails user = (CustomUserDetails) auth.getPrincipal();
                            if (user.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_DRIVER") || a.getAuthority().equals("ROLE_OPERATOR"))) {
                                throw new IllegalArgumentException("Only drivers can subscribe to all deliveries");
                            }
                        } else if (destination.startsWith("/topic/deliveries/")) {
                            try {
                                Long deliveryId = Long.parseLong(destination.substring("/topic/deliveries/".length()));
                                Authentication auth = (Authentication) accessor.getUser();
                                if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails)) {
                                    throw new IllegalArgumentException("Unauthenticated");
                                }
                                CustomUserDetails user = (CustomUserDetails) auth.getPrincipal();
                                
                                Delivery delivery = deliveryRepository.findById(deliveryId).orElseThrow(() -> new IllegalArgumentException("Delivery not found"));
                                com.quickbite.order.Order order = orderRepository.findById(delivery.getOrderId()).orElseThrow(() -> new IllegalArgumentException("Order not found"));
                                if (!order.getCustomerId().equals(user.getCustomerId())) {
                                    throw new IllegalArgumentException("Unauthorized to subscribe to this delivery");
                                }
                            } catch (Exception e) {
                                throw new IllegalArgumentException("Invalid subscription destination: " + e.getMessage());
                            }
                        }
                    }
                } else if (StompCommand.SEND.equals(accessor.getCommand())) {
                    throw new IllegalArgumentException("Clients cannot publish messages");
                }
                return message;
            }
        };
    }
}
