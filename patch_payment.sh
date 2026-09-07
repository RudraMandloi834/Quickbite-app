#!/bin/bash
sed -i '/orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));/a \
        if (!order.getCustomerId().equals(com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId())) {\
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");\
        }' src/main/java/com/quickbite/payment/PaymentService.java

sed -i '/orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));/a \
        Order order = orderRepository.findById(payment.getOrderId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));\
        if (!order.getCustomerId().equals(com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId())) {\
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");\
        }' src/main/java/com/quickbite/payment/PaymentService.java
