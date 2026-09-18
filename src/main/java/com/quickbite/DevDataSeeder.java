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
public class DevDataSeeder implements CommandLineRunner {

    private final CustomerRepository customerRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final PasswordEncoder passwordEncoder;

    public DevDataSeeder(CustomerRepository customerRepository, 
                         RestaurantRepository restaurantRepository,
                         MenuItemRepository menuItemRepository,
                         PasswordEncoder passwordEncoder) {
        this.customerRepository = customerRepository;
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
        this.passwordEncoder = passwordEncoder;
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
            restaurantPartner = customerRepository.save(new Customer("Dev Restaurant Owner", "restaurant@test.com", "4444444444", devPassword, "ROLE_CUSTOMER"));
            System.out.println("Seeded restaurant@test.com");
        } else {
            System.out.println("restaurant@test.com already exists");
        }
        
        // Seed Pending Restaurant
        List<Restaurant> myRestaurants = restaurantRepository.findByOwnerId(restaurantPartner.getId());
        boolean pendingExists = myRestaurants.stream().anyMatch(r -> r.getName().equals("[Demo] Dev Pending Restaurant"));
        if (!pendingExists) {
            Restaurant pendingRest = new Restaurant("[Demo] Dev Pending Restaurant", "Pizza", "Downtown", 0.0, "123 Dev Street", "Dev City", "Dev Area", 0.0, 0.0, "10 AM - 10 PM", 10.0, "https://via.placeholder.com/150");
            pendingRest.setOwnerId(restaurantPartner.getId());
            pendingRest.setStatus(RestaurantStatus.PENDING_APPROVAL);
            restaurantRepository.save(pendingRest);
            System.out.println("Seeded pending restaurant for restaurant@test.com");
        } else {
            System.out.println("Dev Pending Restaurant already exists");
        }

        // Seed Approved Restaurant
        Restaurant approvedRest = myRestaurants.stream()
                .filter(r -> r.getName().equals("[Demo] Dev Approved Restaurant"))
                .findFirst()
                .orElse(null);
                
        if (approvedRest == null) {
            approvedRest = new Restaurant("[Demo] Dev Approved Restaurant", "Burger", "Uptown", 4.5, "456 Dev Ave", "Dev City", "Dev Area", 0.0, 0.0, "10 AM - 10 PM", 5.0, "https://via.placeholder.com/150");
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

        System.out.println("Development data seeding complete! Password for all accounts is: dev123");
    }
}
