package com.quickbite.cart;

public record AddCartItemRequest(
        Long menuItemId,
        Integer quantity
) {
}
