package com.quickbite.restaurant;

public record CreateRestaurantRequest(
        String name,
        String cuisine,
        String location,
        Double rating
) {
}
