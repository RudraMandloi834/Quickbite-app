package com.quickbite.health;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

@Component
public class PaymentHealthIndicator implements HealthIndicator {

    @Value("${razorpay.key-id:}")
    private String keyId;

    @Override
    public Health health() {
        if (keyId != null && !keyId.isEmpty()) {
            return Health.up().withDetail("provider", "Razorpay").withDetail("configured", true).build();
        }
        return Health.down().withDetail("error", "Razorpay keys missing").build();
    }
}
