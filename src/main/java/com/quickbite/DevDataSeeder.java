package com.quickbite;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.quickbite.customer.Customer;
import com.quickbite.customer.CustomerRepository;
import com.quickbite.restaurant.Restaurant;
import com.quickbite.restaurant.RestaurantRepository;
import com.quickbite.restaurant.RestaurantStatus;
import com.quickbite.menu.MenuItem;
import com.quickbite.menu.MenuItemRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Component
@Profile("dev")
@org.springframework.core.annotation.Order(5)
public class DevDataSeeder implements CommandLineRunner {

    private final CustomerRepository customerRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.quickbite.order.OrderRepository orderRepository;

    public DevDataSeeder(CustomerRepository customerRepository, 
                         RestaurantRepository restaurantRepository,
                         MenuItemRepository menuItemRepository,
                         PasswordEncoder passwordEncoder,
                         com.quickbite.order.OrderRepository orderRepository) {
        this.customerRepository = customerRepository;
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
        this.passwordEncoder = passwordEncoder;
        this.orderRepository = orderRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        System.out.println("Starting development data seeder...");
        String devPassword = passwordEncoder.encode("dev123");

        // 1. Customer
        if (!customerRepository.existsByEmail("customer@test.com")) {
            customerRepository.save(new Customer("Dev Customer", "customer@test.com", "1111111111", devPassword, "ROLE_CUSTOMER"));
            System.out.println("Seeded customer@test.com");
        } else {
            System.out.println("customer@test.com already exists");
        }

        // 2. Admin/Operator
        if (!customerRepository.existsByEmail("admin@test.com")) {
            customerRepository.save(new Customer("Dev Admin", "admin@test.com", "2222222222", devPassword, "ROLE_OPERATOR"));
            System.out.println("Seeded admin@test.com");
        } else {
            System.out.println("admin@test.com already exists");
        }

        // 3. Driver
        if (!customerRepository.existsByEmail("driver@test.com")) {
            customerRepository.save(new Customer("Dev Driver", "driver@test.com", "3333333333", devPassword, "ROLE_DRIVER"));
            System.out.println("Seeded driver@test.com");
        } else {
            System.out.println("driver@test.com already exists");
        }

        // 4. Restaurant Partner
        Customer restaurantPartner = customerRepository.findByEmail("restaurant@test.com").orElse(null);
        if (restaurantPartner == null) {
            restaurantPartner = customerRepository.save(new Customer("Dev Restaurant Owner", "restaurant@test.com", "4444444444", devPassword, "ROLE_RESTAURANT_PARTNER"));
            System.out.println("Seeded restaurant@test.com");
        } else {
            restaurantPartner.setPassword(devPassword);
            restaurantPartner.setRole("ROLE_RESTAURANT_PARTNER");
            restaurantPartner = customerRepository.save(restaurantPartner);
            System.out.println("restaurant@test.com already exists - updated password and role");
        }
        
        // Seed Pending Restaurant
        List<Restaurant> myRestaurants = restaurantRepository.findByOwnerId(restaurantPartner.getId());
        boolean pendingExists = myRestaurants.stream().anyMatch(r -> r.getName().equals("Dev Pending Restaurant"));
        if (!pendingExists) {
            Restaurant pendingRest = new Restaurant("Dev Pending Restaurant", "Pizza", "Indiranagar", 0.0, "4th Block, 100ft Road", "Bengaluru", "Bengaluru", 0.0, 0.0, "10 AM - 10 PM", 10.0, "https://via.placeholder.com/150");
            pendingRest.setOwnerId(restaurantPartner.getId());
            pendingRest.setStatus(RestaurantStatus.PENDING_APPROVAL);
            restaurantRepository.save(pendingRest);
            System.out.println("Seeded pending restaurant for restaurant@test.com");
        } else {
            System.out.println("Dev Pending Restaurant already exists");
        }

        // Seed Approved Restaurant
        Restaurant approvedRest = myRestaurants.stream()
                .filter(r -> r.getName().equals("Dev Approved Restaurant"))
                .findFirst()
                .orElse(null);
                
        if (approvedRest == null) {
            approvedRest = new Restaurant("Dev Approved Restaurant", "Burger", "Koramangala", 4.5, "80ft Road", "Bengaluru", "Bengaluru", 0.0, 0.0, "10 AM - 10 PM", 5.0, "https://via.placeholder.com/150");
            approvedRest.setOwnerId(restaurantPartner.getId());
            approvedRest.setStatus(RestaurantStatus.APPROVED);
            approvedRest = restaurantRepository.save(approvedRest);
            System.out.println("Seeded approved restaurant for restaurant@test.com");
        } else {
            System.out.println("Dev Approved Restaurant already exists");
        }
        
        // Seed Menu Items for Approved Restaurant
        List<MenuItem> items = menuItemRepository.findByRestaurantId(approvedRest.getId());
        boolean burgerExists = items.stream().anyMatch(i -> i.getName().equals("Dev Burger"));
        if (!burgerExists) {
            menuItemRepository.save(new MenuItem(approvedRest.getId(), "Dev Burger", "A delicious dev burger", new BigDecimal("12.99"), true, "https://via.placeholder.com/150"));
            System.out.println("Seeded Dev Burger");
        } else {
            System.out.println("Dev Burger already exists");
        }
        
        boolean friesExists = items.stream().anyMatch(i -> i.getName().equals("Dev Fries"));
        if (!friesExists) {
            menuItemRepository.save(new MenuItem(approvedRest.getId(), "Dev Fries", "Crispy dev fries", new BigDecimal("4.99"), true, "https://via.placeholder.com/150"));
            System.out.println("Seeded Dev Fries");
        } else {
            System.out.println("Dev Fries already exists");
        }

        // Ensure any existing DB restaurants that have orders are owned by the demo restaurant partner
        final Long partnerId = restaurantPartner.getId();
        orderRepository.findAll().forEach(order -> {
            if (order.getRestaurantId() != null) {
                restaurantRepository.findById(order.getRestaurantId()).ifPresent(r -> {
                    if (r.getOwnerId() == null) {
                        r.setOwnerId(partnerId);
                        restaurantRepository.save(r);
                        System.out.println("Associated restaurant " + r.getName() + " (ID: " + r.getId() + ") with restaurantPartner");
                    }
                });
            }
        });

        System.out.println("Development data seeding complete! Password for all accounts is: dev123");
    }
}
