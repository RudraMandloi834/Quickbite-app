package com.quickbite.restaurant;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class RestaurantDataInitializer implements CommandLineRunner {

    private final RestaurantService restaurantService;

    public RestaurantDataInitializer(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @Override
    public void run(String... args) {
        restaurantService.addSampleRestaurantsIfEmpty();
    }
}
