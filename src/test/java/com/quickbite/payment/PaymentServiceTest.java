package com.quickbite.payment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;

import java.math.BigDecimal;
import java.util.Optional;

import com.quickbite.order.Order;
import com.quickbite.order.OrderRepository;
import com.quickbite.order.OrderStatus;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
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
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private RazorpayClientWrapper razorpayClient;

    @Mock
    private com.quickbite.delivery.DeliveryService deliveryService;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
            new CustomUserDetails("test@test.com", "pass", Collections.emptyList(), 1L), null));
        paymentService = new PaymentService(paymentRepository, orderRepository, razorpayClient, deliveryService);
    }

    @Test
    void createsRazorpayOrderAndSavesPendingPayment() throws Exception {
        Order order = new Order(1L, 1L, BigDecimal.valueOf(250));
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(paymentRepository.existsByOrderIdAndStatus(1L, PaymentStatus.SUCCESS)).thenReturn(false);

        com.razorpay.Order mockRazorpayOrder = new com.razorpay.Order(new JSONObject("{\"id\":\"order_razorpay_123\"}"));
        when(razorpayClient.createOrder(any(JSONObject.class))).thenReturn(mockRazorpayOrder);
        when(razorpayClient.getKeyId()).thenReturn("rzp_test_key");

        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment p = invocation.getArgument(0);
            return new Payment(p.getOrderId(), p.getAmount(), p.getRazorpayOrderId(), p.getStatus());
        });

        PaymentInitiationResponse response = paymentService.createRazorpayOrder(1L);

        assertEquals("order_razorpay_123", response.getRazorpayOrderId());
        assertEquals("rzp_test_key", response.getRazorpayKeyId());
        assertEquals(BigDecimal.valueOf(250), response.getAmount());
        assertEquals(OrderStatus.PENDING, order.getStatus()); // Order should not be confirmed yet
        
        verify(paymentRepository).save(any(Payment.class));
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void rejectsPaymentForMissingOrder() {
        when(orderRepository.findById(99L)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> paymentService.createRazorpayOrder(99L)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    @Test
    void rejectsPaymentForNonPendingOrder() {
        Order order = new Order(1L, 1L, BigDecimal.valueOf(250));
        order.cancel();
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> paymentService.createRazorpayOrder(1L)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
    }

    @Test
    void rejectsDuplicateSuccessfulPayment() {
        Order order = new Order(1L, 1L, BigDecimal.valueOf(250));
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(paymentRepository.existsByOrderIdAndStatus(1L, PaymentStatus.SUCCESS)).thenReturn(true);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> paymentService.createRazorpayOrder(1L)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
    }

    @Test
    void verifiesValidSignatureAndConfirmsOrder() {
        // Simulate client passing a slightly different casing or string that still matches in the DB
        PaymentVerificationRequest req = new PaymentVerificationRequest("pay_123", "order_123_client", "valid_sig");
        // The server-side stored payment has the definitive order ID
        Payment payment = new Payment(1L, BigDecimal.valueOf(250), "order_123_server", PaymentStatus.PENDING);
        
        when(paymentRepository.findByRazorpayOrderId("order_123_client")).thenReturn(Optional.of(payment));
        // Expecting the wrapper to be called with the server-side ID
        when(razorpayClient.verifySignature("order_123_server", "pay_123", "valid_sig")).thenReturn(true);
        when(paymentRepository.save(payment)).thenReturn(payment);

        Order order = new Order(1L, 1L, BigDecimal.valueOf(250));
        // mock order.getId() will return null unless we use reflection or a test builder. Wait, Order has an id field generated. We might need to mock or just let it pass as null?
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        Payment verifiedPayment = paymentService.verifyPayment(req);

        assertEquals(PaymentStatus.SUCCESS, verifiedPayment.getStatus());
        assertEquals("pay_123", verifiedPayment.getRazorpayPaymentId());
        assertEquals(OrderStatus.CONFIRMED, order.getStatus());
        
        verify(razorpayClient).verifySignature("order_123_server", "pay_123", "valid_sig");
        verify(paymentRepository).save(payment);
        verify(orderRepository).save(order);
        verify(deliveryService).createDeliveryForOrder(order.getId());
    }

    @Test
    void rejectsInvalidSignatureAndDoesNotConfirmOrder() {
        PaymentVerificationRequest req = new PaymentVerificationRequest("pay_123", "order_123", "invalid_sig");
        Payment payment = new Payment(1L, BigDecimal.valueOf(250), "order_123", PaymentStatus.PENDING);

        when(paymentRepository.findByRazorpayOrderId("order_123")).thenReturn(Optional.of(payment));
        when(razorpayClient.verifySignature("order_123", "pay_123", "invalid_sig")).thenReturn(false);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> paymentService.verifyPayment(req)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertEquals(PaymentStatus.PENDING, payment.getStatus()); // Should remain pending
        
        verify(paymentRepository, never()).save(any(Payment.class));
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void rejectsUnknownRazorpayOrder() {
        PaymentVerificationRequest req = new PaymentVerificationRequest("pay_123", "unknown_order", "sig");
        when(paymentRepository.findByRazorpayOrderId("unknown_order")).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> paymentService.verifyPayment(req)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    @Test
    void handlesRazorpayClientFailure() throws RazorpayException {
        Order order = new Order(1L, 1L, BigDecimal.valueOf(250));
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(paymentRepository.existsByOrderIdAndStatus(1L, PaymentStatus.SUCCESS)).thenReturn(false);
        when(razorpayClient.createOrder(any(JSONObject.class))).thenThrow(new RazorpayException("API Error"));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> paymentService.createRazorpayOrder(1L)
        );

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, exception.getStatusCode());
    }
}
