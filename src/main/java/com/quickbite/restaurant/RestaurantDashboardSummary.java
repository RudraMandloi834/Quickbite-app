package com.quickbite.restaurant;

import java.util.List;
import com.quickbite.order.Order;

public record RestaurantDashboardSummary(
        String restaurantName,
        RestaurantStatus status,
        long activeMenuItems,
        long pendingOrders,
        long activeOrders,
        List<Order> recentOrders
) {}
