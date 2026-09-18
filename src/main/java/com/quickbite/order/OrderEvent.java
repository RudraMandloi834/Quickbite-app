package com.quickbite.order;

import java.math.BigDecimal;
import java.time.Instant;

public record OrderEvent(
        String eventType,
        Long orderId,
        Long restaurantId,
        OrderStatus status,
        BigDecimal totalAmount,
        Instant timestamp
) {}
