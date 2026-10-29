package com.quickbite.payment;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class RazorpayClientWrapper {

    private final String keyId;
    private final String keySecret;
    private RazorpayClient client;

    public RazorpayClientWrapper(
            @Value("${razorpay.key-id}") String keyId,
            @Value("${razorpay.key-secret}") String keySecret) {
        this.keyId = keyId;
        this.keySecret = keySecret;
        try {
            if (keyId != null && !keyId.isEmpty() && keySecret != null && !keySecret.isEmpty()) {
                this.client = new RazorpayClient(keyId, keySecret);
            }
        } catch (RazorpayException e) {
            throw new RuntimeException("Failed to initialize RazorpayClient", e);
        }
    }

    public Order createOrder(JSONObject orderRequest) throws RazorpayException {
        if (client == null) {
            throw new RazorpayException("RazorpayClient is not initialized.");
        }
        return client.orders.create(orderRequest);
    }

    public boolean verifySignature(String orderId, String paymentId, String signature) {
        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", orderId);
            options.put("razorpay_payment_id", paymentId);
            options.put("razorpay_signature", signature);
            return Utils.verifyPaymentSignature(options, keySecret);
        } catch (Exception e) {
            return false;
        }
    }

    public String getKeyId() {
        return keyId;
    }
}
