package com.quickbite.admin;

import com.quickbite.restaurant.Restaurant;
import com.quickbite.customer.Customer;
import java.time.LocalDateTime;

public class RestaurantAdminDTO {
    private Long id;
    private String name;
    private String ownerName;
    private String ownerEmail;
    private String ownerPhone;
    private String city;
    private String locality;
    private String address;
    private String cuisine;
    private String status;
    private String tempPassword;
    private LocalDateTime createdAt; // Assuming we can use something, or null

    public RestaurantAdminDTO(Restaurant r, Customer c) {
        this.id = r.getId();
        this.name = r.getName();
        this.city = r.getCity();
        this.locality = r.getLocation();
        this.address = r.getAddress();
        this.cuisine = r.getCuisine();
        this.status = r.getStatus() != null ? r.getStatus().name() : "APPROVED";
        
        if (c != null) {
            this.ownerName = c.getName();
            this.ownerEmail = c.getEmail();
            this.ownerPhone = c.getPhone();
        }
    }

    // Getters
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getOwnerName() { return ownerName; }
    public String getOwnerEmail() { return ownerEmail; }
    public String getOwnerPhone() { return ownerPhone; }
    public String getCity() { return city; }
    public String getLocality() { return locality; }
    public String getAddress() { return address; }
    public String getCuisine() { return cuisine; }
    public String getStatus() { return status; }
    public String getTempPassword() { return tempPassword; }
    public void setTempPassword(String tempPassword) { this.tempPassword = tempPassword; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
