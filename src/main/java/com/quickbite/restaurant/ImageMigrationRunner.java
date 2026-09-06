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
        System.out.println("Running deterministic image assignment for restaurants and menus...");
        
        // Unconditionally reassign all restaurants deterministically by ID to increase variety
        for (int i = 0; i < ImageConstants.RESTAURANT_IMAGES.length; i++) {
            jdbcTemplate.update("UPDATE restaurant SET cover_image_url = ? WHERE id % ? = ?", ImageConstants.RESTAURANT_IMAGES[i], ImageConstants.RESTAURANT_IMAGES.length, i);
        }
        
        // Unconditionally reassign all menu items deterministically by ID to increase variety
        for (int i = 0; i < ImageConstants.MENU_IMAGES.length; i++) {
            jdbcTemplate.update("UPDATE menu_item SET image_url = ? WHERE id % ? = ?", ImageConstants.MENU_IMAGES[i], ImageConstants.MENU_IMAGES.length, i);
        }
        
        System.out.println("Image migration completed successfully.");
    }
}
