package com.quickbite.delivery;

import java.time.Instant;

public record DeliveryStatusEvent(
        Long deliveryId,
        Long orderId,
        DeliveryStatus status,
        Instant timestamp
) {}
