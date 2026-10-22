package com.quickbite;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.Map;

@Component
@Order(100) // Ensure it runs after data initializer
public class VerificationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public VerificationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        System.out.println("6. Unique Cover Image URLs: " + jdbcTemplate.queryForObject("SELECT COUNT(DISTINCT cover_image_url) FROM restaurant", Integer.class));
        System.out.println("7. Unique Menu Image URLs: " + jdbcTemplate.queryForObject("SELECT COUNT(DISTINCT image_url) FROM menu_item", Integer.class));
        System.out.println("================================================");
        System.out.println("DATABASE VERIFICATION REPORT (PHASE 3)");
        System.out.println("6. Unique Cover Image URLs: " + jdbcTemplate.queryForObject("SELECT COUNT(DISTINCT cover_image_url) FROM restaurant", Integer.class));
        System.out.println("7. Unique Menu Image URLs: " + jdbcTemplate.queryForObject("SELECT COUNT(DISTINCT image_url) FROM menu_item", Integer.class));
        System.out.println("================================================");
        
        // 1. Total Restaurants
        Integer total = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM restaurant", Integer.class);
        System.out.println("1. Total restaurants: " + total);
        
        // 2. Count by city
        System.out.println("\n2. Count by city:");
        List<Map<String, Object>> cityCounts = jdbcTemplate.queryForList("SELECT city, COUNT(*) as c FROM restaurant GROUP BY city ORDER BY c DESC");
        for (Map<String, Object> row : cityCounts) {
            System.out.println("   - " + row.get("city") + ": " + row.get("c"));
        }
        
        // 3. Invalid/null records
        Integer invalidCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM restaurant WHERE city IS NULL OR latitude IS NULL OR longitude IS NULL OR rating IS NULL OR name IS NULL", 
            Integer.class
        );
        System.out.println("\n3. Invalid/null records: " + invalidCount);
        
        // 4. Foreign/demo records
        Integer foreignCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM restaurant WHERE city IN ('Austin', 'Chicago', 'New York', 'San Francisco') OR name LIKE '%[Demo]%' OR address LIKE '%123 Test St%'", 
            Integer.class
        );
        System.out.println("4. Foreign/demo records: " + foreignCount);
        
        // 5. Duplicate records (using name + address + city)
        Integer duplicates = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM (SELECT name, address, city FROM restaurant GROUP BY name, address, city HAVING COUNT(*) > 1)", 
            Integer.class
        );
        System.out.println("5. Duplicate records (name+address+city): " + (duplicates != null ? duplicates : 0));
        
        System.out.println("================================================\n");
        
        // Shut down the application immediately after verification
        
    }
}
