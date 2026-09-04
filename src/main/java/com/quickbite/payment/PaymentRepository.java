package com.quickbite.payment;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    boolean existsByOrderIdAndStatus(Long orderId, PaymentStatus status);

    java.util.Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
}
