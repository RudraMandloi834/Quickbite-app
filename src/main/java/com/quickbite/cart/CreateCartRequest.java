package com.quickbite.cart;

public record CreateCartRequest(
        Long customerId,
        Long restaurantId
) {
}
