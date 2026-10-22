package com.quickbite.health;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;
import com.quickbite.event.SseService;

@Component
public class SseHealthIndicator implements HealthIndicator {
    private final SseService sseService;
    
    public SseHealthIndicator(SseService sseService) {
        this.sseService = sseService;
    }

    @Override
    public Health health() {
        int clients = sseService.getActiveClientCount();
        return Health.up().withDetail("activeClients", clients).build();
    }
}
