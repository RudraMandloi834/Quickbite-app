package com.quickbite.payment;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/orders/{orderId}")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentInitiationResponse createRazorpayOrder(@PathVariable Long orderId) {
        return paymentService.createRazorpayOrder(orderId);
    }

    @PostMapping("/verify")
    public Payment verifyPayment(@RequestBody PaymentVerificationRequest request) {
        return paymentService.verifyPayment(request);
    }

    @GetMapping("/{paymentId}")
    public Payment getPayment(@PathVariable Long paymentId) {
        return paymentService.getPayment(paymentId);
    }
}
