package com.quickbite.restaurant;

public record CreateRestaurantRequest(
        String name,
        String cuisine,
        String location,
        Double rating,
        String address,
        String city,
        String area,
        Double latitude,
        Double longitude,
        String openingHours,
        Double deliveryRadius,
        String coverImageUrl
) {
}
