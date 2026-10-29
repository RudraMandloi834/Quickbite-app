package com.quickbite.restaurant;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class ImageMigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public ImageMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            Integer unassignedRestaurants = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM restaurant WHERE cover_image_url IS NULL OR cover_image_url = ''", 
                Integer.class
            );
            if (unassignedRestaurants != null && unassignedRestaurants > 0) {
                System.out.println("Running deterministic image assignment for " + unassignedRestaurants + " restaurants...");
                for (int i = 0; i < ImageConstants.RESTAURANT_IMAGES.length; i++) {
                    jdbcTemplate.update("UPDATE restaurant SET cover_image_url = ? WHERE (cover_image_url IS NULL OR cover_image_url = '') AND id % ? = ?", ImageConstants.RESTAURANT_IMAGES[i], ImageConstants.RESTAURANT_IMAGES.length, i);
                }
            }
            
            Integer unassignedMenus = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM menu_item WHERE image_url IS NULL OR image_url = ''", 
                Integer.class
            );
            if (unassignedMenus != null && unassignedMenus > 0) {
                System.out.println("Running deterministic image assignment for " + unassignedMenus + " menu items...");
                for (int i = 0; i < ImageConstants.MENU_IMAGES.length; i++) {
                    jdbcTemplate.update("UPDATE menu_item SET image_url = ? WHERE (image_url IS NULL OR image_url = '') AND id % ? = ?", ImageConstants.MENU_IMAGES[i], ImageConstants.MENU_IMAGES.length, i);
                }
            }
            System.out.println("Image migration check completed.");
        } catch (Exception e) {
            System.out.println("⚠️ Image migration skipped: " + e.getMessage());
        }
    }
}
