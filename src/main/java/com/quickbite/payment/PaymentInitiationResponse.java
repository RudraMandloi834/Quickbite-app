package com.quickbite.payment;

import java.math.BigDecimal;

public class PaymentInitiationResponse {
    private Long paymentId;
    private Long orderId;
    private String razorpayOrderId;
    private BigDecimal amount;
    private String currency;
    private String razorpayKeyId;

    public PaymentInitiationResponse(Long paymentId, Long orderId, String razorpayOrderId, BigDecimal amount, String currency, String razorpayKeyId) {
        this.paymentId = paymentId;
        this.orderId = orderId;
        this.razorpayOrderId = razorpayOrderId;
        this.amount = amount;
        this.currency = currency;
        this.razorpayKeyId = razorpayKeyId;
    }

    public Long getPaymentId() {
        return paymentId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public String getRazorpayOrderId() {
        return razorpayOrderId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getCurrency() {
        return currency;
    }

    public String getRazorpayKeyId() {
        return razorpayKeyId;
    }
}
