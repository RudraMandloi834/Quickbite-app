package com.quickbite.payment;

import com.quickbite.order.Order;
import com.quickbite.order.OrderRepository;
import com.quickbite.order.OrderStatus;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import org.springframework.core.env.Environment;
import java.util.Arrays;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private com.quickbite.order.OrderLifecycleService lifecycleService;
    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private com.quickbite.event.SseService sseService;
    private final RazorpayClientWrapper razorpayClient;
    private final com.quickbite.delivery.DeliveryService deliveryService;
    private final Environment environment;

    public PaymentService(PaymentRepository paymentRepository, OrderRepository orderRepository, RazorpayClientWrapper razorpayClient, com.quickbite.delivery.DeliveryService deliveryService, Environment environment) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.razorpayClient = razorpayClient;
        this.deliveryService = deliveryService;
        this.environment = environment;
    }

    @Transactional
    public PaymentInitiationResponse createRazorpayOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!order.getCustomerId().equals(com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        if ("COD".equalsIgnoreCase(order.getPaymentMethod())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Online payment cannot be initiated for Cash on Delivery orders");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cancelled orders cannot be paid");
        }
        if (order.getStatus() != OrderStatus.PLACED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending orders can be paid");
        }
        if (paymentRepository.existsByOrderIdAndStatus(orderId, PaymentStatus.SUCCESS)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Order has already been paid");
        }

        String[] profiles = environment.getActiveProfiles();
        boolean isDev = profiles != null && java.util.Arrays.asList(profiles).contains("dev");
        if (isDev && (razorpayClient.getKeyId().contains("dummy") || razorpayClient.getKeyId().contains("dev"))) {
            String devRazorpayOrderId = "dev_order_" + orderId + "_" + System.currentTimeMillis();
            Payment payment = paymentRepository.save(new Payment(
                    orderId,
                    order.getTotalAmount(),
                    devRazorpayOrderId,
                    PaymentStatus.PENDING
            ));
            return new PaymentInitiationResponse(
                    payment.getId(),
                    order.getId(),
                    devRazorpayOrderId,
                    order.getTotalAmount(),
                    "INR",
                    razorpayClient.getKeyId()
            );
        }
        try {
            JSONObject orderRequest = new JSONObject();
            int amountInPaise = order.getTotalAmount().multiply(new BigDecimal(100)).intValue();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "txn_" + orderId);

            com.razorpay.Order razorpayOrder = razorpayClient.createOrder(orderRequest);
            String razorpayOrderId = razorpayOrder.get("id");

            Payment payment = paymentRepository.save(new Payment(
                    orderId,
                    order.getTotalAmount(),
                    razorpayOrderId,
                    PaymentStatus.PENDING
            ));

            return new PaymentInitiationResponse(
                    payment.getId(),
                    order.getId(),
                    razorpayOrderId,
                    order.getTotalAmount(),
                    "INR",
                    razorpayClient.getKeyId()
            );

        } catch (RazorpayException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to initiate payment with Razorpay", e);
        }
    }

    @Transactional
    public Payment verifyPayment(PaymentVerificationRequest request) {
        if (request.getRazorpayOrderId() == null || request.getRazorpayPaymentId() == null || request.getRazorpaySignature() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required verification fields");
        }

        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found for given Razorpay order ID"));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return payment;
        }

        String[] profiles = environment.getActiveProfiles();
        boolean isDev = profiles != null && Arrays.asList(profiles).contains("dev");
        if (isDev && "dev_signature".equals(request.getRazorpaySignature())) {
            // Dev bypass
        } else {
            boolean isValid = razorpayClient.verifySignature(
                payment.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
            );

            if (!isValid) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payment signature");
            }
        }

        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setStatus(PaymentStatus.SUCCESS);
        payment = paymentRepository.save(payment);

        Order order = orderRepository.findById(payment.getOrderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!order.getCustomerId().equals(com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        
        Long userId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        // Order is already PLACED, we just update payment record.
        // Auto-confirmed is handled by PLACED state.

        // Delivery creation moved to OrderLifecycleService when status reaches READY_FOR_PICKUP

        return payment;
    }

    
    @Transactional
    public Payment failPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        Long userId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        payment.setStatus(PaymentStatus.FAILED);
        payment = paymentRepository.save(payment);
        lifecycleService.transitionOrder(payment.getOrderId(), OrderStatus.CANCELLED, userId, "ROLE_CUSTOMER", "Payment failed");
        return payment;
    }

    public Payment getPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        Order order = orderRepository.findById(payment.getOrderId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!order.getCustomerId().equals(com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return payment;
    }

    @Transactional
    public Payment confirmCashCollection(Long orderId, Long requestingUserId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (!"COD".equalsIgnoreCase(order.getPaymentMethod())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cash collection can only be confirmed for Cash on Delivery orders");
        }

        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean isOperator = auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OPERATOR"));
        boolean isAssignedDriver = deliveryService != null && deliveryService.isDriverAssignedToOrder(orderId, requestingUserId);

        if (!isOperator && !isAssignedDriver) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the assigned driver or operator can confirm cash collection");
        }

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseGet(() -> paymentRepository.save(new Payment(
                        orderId,
                        order.getTotalAmount(),
                        "COD_" + orderId,
                        PaymentStatus.PENDING
                )));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cash has already been collected for this order");
        }

        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setRazorpayPaymentId("COD_COLLECTED_" + System.currentTimeMillis());
        Payment savedPayment = paymentRepository.save(payment);

        if (sseService != null) {
            com.quickbite.event.SystemEvent sysEvent = new com.quickbite.event.SystemEvent(
                    java.util.UUID.randomUUID().toString(),
                    "PAYMENT_SUCCESS",
                    order.getId(),
                    order.getRestaurantId(),
                    order.getCustomerId(),
                    requestingUserId,
                    "Cash collected: SUCCESS"
            );
            sseService.emitToCustomer(order.getCustomerId(), sysEvent);
            if (order.getRestaurantId() != null) {
                sseService.emitToRestaurant(order.getRestaurantId(), sysEvent);
            }
            if (requestingUserId != null) {
                sseService.emitToDriver(requestingUserId, sysEvent);
            }
            sseService.emitToAdmins(sysEvent);
        }

        return savedPayment;
    }
}
