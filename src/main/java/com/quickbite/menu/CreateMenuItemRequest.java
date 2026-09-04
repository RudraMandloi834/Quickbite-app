package com.quickbite.menu;

import java.math.BigDecimal;

public record CreateMenuItemRequest(
        String name,
        String description,
        BigDecimal price,
        Boolean available
) {
}
