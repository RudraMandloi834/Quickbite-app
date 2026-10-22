package com.quickbite.health;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
public class OutboxMonitorIndicator implements HealthIndicator {
    // Stub implementation for monitoring stalled transactional events
    @Override
    public Health health() {
        return Health.up().withDetail("stalledEvents", 0).withDetail("retryQueue", 0).build();
    }
}
