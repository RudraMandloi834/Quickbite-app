package com.quickbite.restaurant;

public interface NearbyRestaurantProjection {
    Long getId();
    String getName();
    String getCuisine();
    String getLocation();
    double getRating();
    String getAddress();
    String getCity();
    String getArea();
    Double getLatitude();
    Double getLongitude();
    String getOpeningHours();
    Double getDeliveryRadius();
    String getCoverImageUrl();
    Double getDistanceKm();
}
