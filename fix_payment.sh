#!/bin/bash
sed -i '/try {/i \
        String[] profiles = environment.getActiveProfiles();\
        boolean isDev = profiles != null && java.util.Arrays.asList(profiles).contains("dev");\
        if (isDev && (razorpayClient.getKeyId().equals("dummy") || razorpayClient.getKeyId().contains("dev"))) {\
            String devRazorpayOrderId = "dev_order_" + orderId + "_" + System.currentTimeMillis();\
            Payment payment = paymentRepository.save(new Payment(\
                    orderId,\
                    order.getTotalAmount(),\
                    devRazorpayOrderId,\
                    PaymentStatus.PENDING\
            ));\
            return new PaymentInitiationResponse(\
                    payment.getId(),\
                    order.getId(),\
                    devRazorpayOrderId,\
                    order.getTotalAmount(),\
                    "INR",\
                    razorpayClient.getKeyId()\
            );\
        }' src/main/java/com/quickbite/payment/PaymentService.java
