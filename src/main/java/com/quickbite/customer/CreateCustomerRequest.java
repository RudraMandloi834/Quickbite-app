package com.quickbite.customer;

public record CreateCustomerRequest(
        String name,
        String email,
        String phone
) {
}
