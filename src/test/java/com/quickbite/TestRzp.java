package com.quickbite;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;

public class TestRzp {
    public static void main(String[] args) {
        String key = System.getenv("RAZORPAY_KEY_ID");
        String secret = System.getenv("RAZORPAY_KEY_SECRET");
        System.out.println("Key: [" + key + "]");
        try {
            RazorpayClient client = new RazorpayClient(key, secret);
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", 50000);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "txn_27");
            client.orders.create(orderRequest);
            System.out.println("Success");
        } catch (Exception e) {
            System.out.println("Exception type: " + e.getClass().getName());
            System.out.println("Failed: " + e.getMessage());
        }
    }
}
