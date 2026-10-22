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
    private Integer reviewCount = 0;
    private Integer priceRange = 1;
    private Boolean deliveryAvailability = true;
    private Integer deliveryTimeMinutes = 30;

    private String address;
    private String city;
    private String area;
    private Double latitude;
    private Double longitude;
    private String openingHours;
    private Double deliveryRadius;
    private String coverImageUrl;

    @jakarta.persistence.Enumerated(jakarta.persistence.EnumType.STRING)
    private RestaurantStatus status;

    private Long ownerId;
    private java.time.Instant createdAt = java.time.Instant.now();

    private Long reviewedBy;
    private java.time.Instant reviewedAt;
    private String rejectionReason;
    
    @jakarta.persistence.Transient
    private String tempPassword;
    
    private String phone;
    private String email;
    private String openingTime;
    private String closingTime;

    public Long getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(Long reviewedBy) { this.reviewedBy = reviewedBy; }
    public java.time.Instant getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(java.time.Instant reviewedAt) { this.reviewedAt = reviewedAt; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

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
    public Integer getReviewCount() { return reviewCount; }
    public void setReviewCount(Integer reviewCount) { this.reviewCount = reviewCount; }
    public Integer getPriceRange() { return priceRange; }
    public void setPriceRange(Integer priceRange) { this.priceRange = priceRange; }
    public Boolean getDeliveryAvailability() { return deliveryAvailability; }
    public void setDeliveryAvailability(Boolean deliveryAvailability) { this.deliveryAvailability = deliveryAvailability; }
    public Integer getDeliveryTimeMinutes() { return deliveryTimeMinutes; }
    public void setDeliveryTimeMinutes(Integer deliveryTimeMinutes) { this.deliveryTimeMinutes = deliveryTimeMinutes; }
    public String getAddress() { return address; }
    public String getCity() { return city; }
    public String getArea() { return area; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public String getOpeningHours() { return openingHours; }
    public Double getDeliveryRadius() { return deliveryRadius; }
    public String getCoverImageUrl() { return coverImageUrl; }

    public RestaurantStatus getStatus() {
        return status != null ? status : RestaurantStatus.APPROVED;
    }
    public void setStatus(RestaurantStatus status) {
        this.status = status;
    }

    public java.time.Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(java.time.Instant createdAt) { this.createdAt = createdAt; }
    public Long getOwnerId() {
        return ownerId;
    }
    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getOpeningTime() { return openingTime; }
    public void setOpeningTime(String openingTime) { this.openingTime = openingTime; }
    public String getClosingTime() { return closingTime; }
    public String getTempPassword() { return tempPassword; }
    public void setTempPassword(String tempPassword) { this.tempPassword = tempPassword; }
    public void setClosingTime(String closingTime) { this.closingTime = closingTime; }
}
