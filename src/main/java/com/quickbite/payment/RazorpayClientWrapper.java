package com.quickbite.payment;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class RazorpayClientWrapper {

    private static final Logger logger = LoggerFactory.getLogger(RazorpayClientWrapper.class);

    private final String keyId;
    private final String keySecret;
    private RazorpayClient client;

    public RazorpayClientWrapper(
            @Value("${razorpay.key-id:rzp_test_dummy}") String keyId,
            @Value("${razorpay.key-secret:dummysecret}") String keySecret) {
        this.keyId = keyId != null ? keyId.trim() : "";
        this.keySecret = keySecret != null ? keySecret.trim() : "";
        try {
            if (isConfigured()) {
                this.client = new RazorpayClient(this.keyId, this.keySecret);
                logger.info("Razorpay client initialized successfully.");
            } else {
                logger.info("Razorpay is not configured with production credentials. Online payments will report unconfigured; COD remains fully active.");
            }
        } catch (RazorpayException e) {
            logger.warn("Failed to initialize RazorpayClient: {}", e.getMessage());
        }
    }

    public boolean isConfigured() {
        return keyId != null && !keyId.isBlank()
                && !keyId.contains("dummy") && !keyId.contains("dev")
                && keySecret != null && !keySecret.isBlank()
                && !keySecret.contains("dummy") && !keySecret.contains("dev");
    }

    public Order createOrder(JSONObject orderRequest) throws RazorpayException {
        if (!isConfigured() || client == null) {
            throw new RazorpayException("Razorpay online payment gateway is not configured.");
        }
        return client.orders.create(orderRequest);
    }

    public boolean verifySignature(String orderId, String paymentId, String signature) {
        if (!isConfigured() || keySecret.isEmpty()) {
            return false;
        }
        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", orderId);
            options.put("razorpay_payment_id", paymentId);
            options.put("razorpay_signature", signature);
            return Utils.verifyPaymentSignature(options, keySecret);
        } catch (Exception e) {
            logger.warn("Razorpay signature verification failed: {}", e.getMessage());
            return false;
        }
    }

    public String getKeyId() {
        return keyId;
    }
}
