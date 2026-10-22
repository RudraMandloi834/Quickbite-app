package com.quickbite.logging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class AuditLogger {
    private static final Logger logger = LoggerFactory.getLogger("AUDIT");

    public void logRestaurantApproval(Long restaurantId, String adminEmail, String status) {
        logger.info("AUDIT_EVENT=RESTAURANT_APPROVAL RESTAURANT_ID={} ADMIN={} STATUS={}", restaurantId, adminEmail, status);
    }

    public void logOwnerJoinApproval(Long restaurantId, Long ownerId, String adminEmail, String status) {
        logger.info("AUDIT_EVENT=OWNER_JOIN_APPROVAL RESTAURANT_ID={} OWNER_ID={} ADMIN={} STATUS={}", restaurantId, ownerId, adminEmail, status);
    }

    public void logPaymentVerification(Long orderId, String paymentId, String status) {
        logger.info("AUDIT_EVENT=PAYMENT_VERIFICATION ORDER_ID={} PAYMENT_ID={} STATUS={}", orderId, paymentId, status);
    }

    public void logOrderStatusChange(Long orderId, String oldStatus, String newStatus, String changedBy) {
        logger.info("AUDIT_EVENT=ORDER_STATUS_CHANGE ORDER_ID={} OLD_STATUS={} NEW_STATUS={} CHANGED_BY={}", orderId, oldStatus, newStatus, changedBy);
    }

    public void logDeliveryStatusChange(Long deliveryId, String oldStatus, String newStatus, String driverName) {
        logger.info("AUDIT_EVENT=DELIVERY_STATUS_CHANGE DELIVERY_ID={} OLD_STATUS={} NEW_STATUS={} DRIVER={}", deliveryId, oldStatus, newStatus, driverName);
    }
}
