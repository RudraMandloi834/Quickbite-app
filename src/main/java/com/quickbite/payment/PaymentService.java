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

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final RazorpayClientWrapper razorpayClient;

    public PaymentService(PaymentRepository paymentRepository, OrderRepository orderRepository, RazorpayClientWrapper razorpayClient) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.razorpayClient = razorpayClient;
    }

    @Transactional
    public PaymentInitiationResponse createRazorpayOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cancelled orders cannot be paid");
        }
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending orders can be paid");
        }
        if (paymentRepository.existsByOrderIdAndStatus(orderId, PaymentStatus.SUCCESS)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Order has already been paid");
        }

        try {
            JSONObject orderRequest = new JSONObject();
            // Amount in subunits (paise for INR)
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

        boolean isValid = razorpayClient.verifySignature(
                payment.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
        );

        if (!isValid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payment signature");
        }

        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setStatus(PaymentStatus.SUCCESS);
        payment = paymentRepository.save(payment);

        Order order = orderRepository.findById(payment.getOrderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        
        order.confirm();
        orderRepository.save(order);

        return payment;
    }

    public Payment getPayment(Long paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
    }
}
