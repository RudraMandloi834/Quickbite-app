package com.quickbite.payment;

import com.quickbite.delivery.DeliveryService;
import com.quickbite.order.Order;
import com.quickbite.order.OrderRepository;
import com.quickbite.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
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

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new CustomUserDetails("test@test.com", "pass", Collections.emptyList(), 1L), null));
        paymentService = new PaymentService(paymentRepository, orderRepository, razorpayClient, deliveryService, environment);
    }

    @Test
    void productionRejectsDevSignatureBypass() {
        // Return "prod" profile, not "dev"
        when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});

        Payment pendingPayment = new Payment(1L, BigDecimal.valueOf(250), "order_rzp1", PaymentStatus.PENDING);
        when(paymentRepository.findByRazorpayOrderId("order_rzp1")).thenReturn(Optional.of(pendingPayment));
        
        // Mock verification failure because the signature is "dev_signature" which is invalid in Razorpay
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
}
