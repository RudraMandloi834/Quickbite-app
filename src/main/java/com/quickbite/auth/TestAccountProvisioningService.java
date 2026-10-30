package com.quickbite.auth;

import com.quickbite.customer.Customer;
import com.quickbite.customer.CustomerRepository;
import com.quickbite.menu.MenuItem;
import com.quickbite.menu.MenuItemRepository;
import com.quickbite.order.OrderRepository;
import com.quickbite.restaurant.Restaurant;
import com.quickbite.restaurant.RestaurantRepository;
import com.quickbite.restaurant.RestaurantStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class TestAccountProvisioningService {

    private static final Logger logger = LoggerFactory.getLogger(TestAccountProvisioningService.class);

    private final CustomerRepository customerRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    public TestAccountProvisioningService(
            CustomerRepository customerRepository,
            RestaurantRepository restaurantRepository,
            MenuItemRepository menuItemRepository,
            OrderRepository orderRepository,
            PasswordEncoder passwordEncoder) {
        this.customerRepository = customerRepository;
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
        this.orderRepository = orderRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public boolean hasAdminAccount() {
        return customerRepository.countByRole("ROLE_OPERATOR") > 0 || customerRepository.countByRole("ROLE_ADMIN") > 0;
    }

    @Transactional
    public Customer provisionAdmin(String name, String email, String password) {
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            throw new IllegalArgumentException("Admin email and password must not be blank");
        }
        String cleanEmail = email.trim().toLowerCase();
        Optional<Customer> existing = customerRepository.findByEmailIgnoreCase(cleanEmail);
        String encoded = passwordEncoder.encode(password.trim());

        if (existing.isPresent()) {
            Customer admin = existing.get();
            admin.setPassword(encoded);
            admin.setRole("ROLE_OPERATOR");
            if (name != null && !name.isBlank()) admin.setName(name.trim());
            Customer saved = customerRepository.save(admin);
            logger.info("Updated existing administrator account: {}", cleanEmail);
            return saved;
        }

        Customer newAdmin = new Customer(
                (name != null && !name.isBlank()) ? name.trim() : "Platform Administrator",
                cleanEmail,
                "9876543210",
                encoded,
                "ROLE_OPERATOR"
        );
        Customer saved = customerRepository.save(newAdmin);
        logger.info("Successfully provisioned initial administrator account: {}", cleanEmail);
        return saved;
    }

    @Transactional
    public Map<String, Object> provisionTestAccounts(String password) {
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password for test accounts cannot be blank");
        }
        String encodedPassword = passwordEncoder.encode(password.trim());
        Map<String, Object> result = new HashMap<>();

        // 1. Customer
        Customer customer = upsertAccount(
                "customer@test.com",
                "Demo Customer",
                "9876543210",
                encodedPassword,
                "ROLE_CUSTOMER"
        );
        result.put("customer", customer.getEmail());

        // 2. Platform Admin / Operator
        Customer admin = upsertAccount(
                "admin@test.com",
                "Platform Administrator",
                "9876543211",
                encodedPassword,
                "ROLE_OPERATOR"
        );
        result.put("admin", admin.getEmail());

        // 3. Delivery Driver
        Customer driver = upsertAccount(
                "driver@test.com",
                "Demo Delivery Partner",
                "9876543212",
                encodedPassword,
                "ROLE_DRIVER"
        );
        result.put("driver", driver.getEmail());

        // 4. Restaurant Partner / Owner
        Customer partner = upsertAccount(
                "restaurant@test.com",
                "Demo Restaurant Partner",
                "9876543213",
                encodedPassword,
                "ROLE_RESTAURANT_PARTNER"
        );
        result.put("restaurantPartner", partner.getEmail());

        // Ensure partner has an approved restaurant and menu items
        ensureRestaurantForPartner(partner);

        logger.info("Test account provisioning completed successfully for customer, admin, driver, and restaurant partner.");
        result.put("status", "SUCCESS");
        result.put("message", "All 4 role test accounts provisioned and configured.");
        return result;
    }

    private Customer upsertAccount(String email, String defaultName, String phone, String encodedPassword, String role) {
        String cleanEmail = email.trim().toLowerCase();
        Optional<Customer> existing = customerRepository.findByEmailIgnoreCase(cleanEmail);
        if (existing.isPresent()) {
            Customer user = existing.get();
            user.setPassword(encodedPassword);
            user.setRole(role);
            Customer saved = customerRepository.save(user);
            logger.info("Test account {} updated with active password and role {}", cleanEmail, role);
            return saved;
        } else {
            Customer user = new Customer(defaultName, cleanEmail, phone, encodedPassword, role);
            Customer saved = customerRepository.save(user);
            logger.info("Test account {} created with role {}", cleanEmail, role);
            return saved;
        }
    }

    private void ensureRestaurantForPartner(Customer partner) {
        List<Restaurant> myRestaurants = restaurantRepository.findByOwnerId(partner.getId());
        Restaurant testRest = myRestaurants.stream()
                .filter(r -> r.getStatus() == RestaurantStatus.APPROVED)
                .findFirst()
                .orElse(null);

        if (testRest == null) {
            // Find existing approved restaurant or create one
            testRest = restaurantRepository.findAll().stream()
                    .filter(r -> r.getStatus() == RestaurantStatus.APPROVED && (r.getOwnerId() == null || r.getOwnerId().equals(partner.getId())))
                    .findFirst()
                    .orElse(null);

            if (testRest != null) {
                testRest.setOwnerId(partner.getId());
                testRest = restaurantRepository.save(testRest);
                logger.info("Assigned approved restaurant '{}' (ID: {}) to demo restaurant partner", testRest.getName(), testRest.getId());
            } else {
                testRest = new Restaurant(
                        "QuickBite Kitchen & Bistro",
                        "North Indian, Biryani, Mughlai",
                        "Bandra West",
                        4.8,
                        "Linking Road, Bandra West",
                        "Mumbai",
                        "Mumbai",
                        19.0596,
                        72.8295,
                        "10:00 AM - 11:00 PM",
                        30.0,
                        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80"
                );
                testRest.setOwnerId(partner.getId());
                testRest.setStatus(RestaurantStatus.APPROVED);
                testRest = restaurantRepository.save(testRest);
                logger.info("Created new demo restaurant '{}' (ID: {}) for partner", testRest.getName(), testRest.getId());
            }
        }

        // Ensure menu items exist
        List<MenuItem> items = menuItemRepository.findByRestaurantId(testRest.getId());
        if (items.isEmpty()) {
            menuItemRepository.save(new MenuItem(testRest.getId(), "Paneer Butter Masala", "Cottage cheese simmered in buttery tomato cashew gravy", new BigDecimal("320.00"), true, "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=60"));
            menuItemRepository.save(new MenuItem(testRest.getId(), "Dum Chicken Biryani", "Fragrant basmati rice slow-cooked with spiced tender chicken", new BigDecimal("380.00"), true, "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60"));
            menuItemRepository.save(new MenuItem(testRest.getId(), "Garlic Butter Naan", "Clay-oven baked bread infused with minced garlic and butter", new BigDecimal("60.00"), true, "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60"));
            logger.info("Seeded 3 menu items for demo restaurant ID: {}", testRest.getId());
        }

        // Associate any unowned restaurants that have active orders
        final Long partnerId = partner.getId();
        orderRepository.findAll().forEach(order -> {
            if (order.getRestaurantId() != null) {
                restaurantRepository.findById(order.getRestaurantId()).ifPresent(r -> {
                    if (r.getOwnerId() == null) {
                        r.setOwnerId(partnerId);
                        restaurantRepository.save(r);
                    }
                });
            }
        });
    }
}
