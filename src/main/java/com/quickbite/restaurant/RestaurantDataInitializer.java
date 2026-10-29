package com.quickbite.restaurant;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(10)
public class RestaurantDataInitializer implements CommandLineRunner {

    private final SyntheticDataGenerator syntheticDataGenerator;

    public RestaurantDataInitializer(SyntheticDataGenerator syntheticDataGenerator) {
        this.syntheticDataGenerator = syntheticDataGenerator;
    }

    @Override
    public void run(String... args) {
        syntheticDataGenerator.startSeeding();
    }
}
