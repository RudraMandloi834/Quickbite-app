package com.quickbite.payment;

import com.quickbite.delivery.DeliveryService;
import com.quickbite.order.Order;
import com.quickbite.order.OrderRepository;
import com.quickbite.order.OrderStatus;
import com.quickbite.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PaymentServiceProductionTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private RazorpayClientWrapper razorpayClient;

    @Mock
    private DeliveryService deliveryService;

    @Mock
    private Environment environment;

    private PaymentService paymentService;

    private final Long customerId = 1L;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new CustomUserDetails("customer@test.com", "pass", Collections.emptyList(), customerId), null));
        paymentService = new PaymentService(paymentRepository, orderRepository, razorpayClient, deliveryService, environment);
    }

    @Test
    @DisplayName("Signature verification rejection: invalid signatures fail verification in production")
    void productionRejectsDevSignatureBypass() {
        Payment pendingPayment = new Payment(1L, BigDecimal.valueOf(250), "order_rzp1", PaymentStatus.PENDING);
        when(paymentRepository.findByRazorpayOrderId("order_rzp1")).thenReturn(Optional.of(pendingPayment));
        when(razorpayClient.isConfigured()).thenReturn(true);
        when(razorpayClient.verifySignature("order_rzp1", "pay_dev", "dev_signature")).thenReturn(false);

        PaymentVerificationRequest request = new PaymentVerificationRequest();
        request.setRazorpayOrderId("order_rzp1");
        request.setRazorpayPaymentId("pay_dev");
        request.setRazorpaySignature("dev_signature");

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            paymentService.verifyPayment(request);
        });

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertEquals("Invalid payment signature", exception.getReason());
        verify(razorpayClient).verifySignature("order_rzp1", "pay_dev", "dev_signature");
    }

    @Test
    @DisplayName("Unconfigured Gateway: Throws SERVICE_UNAVAILABLE (503) with clear message advising COD")
    void testUnconfiguredRazorpayThrowsServiceUnavailable() {
        Order order = new Order(customerId, 10L, BigDecimal.valueOf(300));
        order.setStatus(OrderStatus.PLACED);
        order.setPaymentMethod("CARD");

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(razorpayClient.isConfigured()).thenReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> paymentService.createRazorpayOrder(1L));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Cash on Delivery (COD)"));
    }

    @Test
    @DisplayName("COD Online Initiation Rejection: Throws BAD_REQUEST if attempting online payment on a COD order")
    void testCODOrderRejectsOnlineInitiation() {
        Order order = new Order(customerId, 10L, BigDecimal.valueOf(300));
        order.setStatus(OrderStatus.PLACED);
        order.setPaymentMethod("COD");

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> paymentService.createRazorpayOrder(1L));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Cash on Delivery"));
    }
}
