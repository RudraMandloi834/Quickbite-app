package com.quickbite.restaurant;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Index;

@Entity
@Table(
    name = "restaurant",
    indexes = {
        @Index(name = "idx_restaurant_lat_lng", columnList = "latitude, longitude"),
        @Index(name = "idx_restaurant_city", columnList = "city")
    }
)
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String cuisine;
    private String location; // legacy/frontend field
    private double rating;
    
    private String address;
    private String city;
    private String area;
    private Double latitude;
    private Double longitude;
    private String openingHours;
    private Double deliveryRadius;
    private String coverImageUrl;

    protected Restaurant() {
    }

    public Restaurant(String name, String cuisine, String location, double rating) {
        this.name = name;
        this.cuisine = cuisine;
        this.location = location;
        this.rating = rating;
    }

    public Restaurant(String name, String cuisine, String location, double rating, String address, String city, String area, Double latitude, Double longitude, String openingHours, Double deliveryRadius, String coverImageUrl) {
        this.name = name;
        this.cuisine = cuisine;
        this.location = location;
        this.rating = rating;
        this.address = address;
        this.city = city;
        this.area = area;
        this.latitude = latitude;
        this.longitude = longitude;
        this.openingHours = openingHours;
        this.deliveryRadius = deliveryRadius;
        this.coverImageUrl = coverImageUrl;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCuisine() { return cuisine; }
    public String getLocation() { return location; }
    public double getRating() { return rating; }
    public String getAddress() { return address; }
    public String getCity() { return city; }
    public String getArea() { return area; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public String getOpeningHours() { return openingHours; }
    public Double getDeliveryRadius() { return deliveryRadius; }
    public String getCoverImageUrl() { return coverImageUrl; }
}
