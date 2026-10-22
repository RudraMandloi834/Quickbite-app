package com.quickbite;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class FixEnumSchemaRunner implements CommandLineRunner {
    private final JdbcTemplate jdbcTemplate;
    public FixEnumSchemaRunner(JdbcTemplate jdbcTemplate) { this.jdbcTemplate = jdbcTemplate; }
    
    @Override
    public void run(String... args) throws Exception {
        try {
            jdbcTemplate.execute("ALTER TABLE order_status_history ALTER COLUMN new_status SET DATA TYPE VARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE order_status_history ALTER COLUMN previous_status SET DATA TYPE VARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE orders ALTER COLUMN status SET DATA TYPE VARCHAR(255)");
            System.out.println("✅ Forcefully patched H2 ENUM schema constraints!");
        } catch (Exception e) {
            System.out.println("⚠️ Could not patch H2 schema: " + e.getMessage());
        }
    }
}
