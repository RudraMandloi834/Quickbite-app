package com.quickbite;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(1)
public class FixEnumSchemaRunner implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(FixEnumSchemaRunner.class);
    private final JdbcTemplate jdbcTemplate;

    public FixEnumSchemaRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            // Drop check constraints if they exist (PostgreSQL / H2)
            jdbcTemplate.execute("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check");
            jdbcTemplate.execute("ALTER TABLE order_status_history DROP CONSTRAINT IF EXISTS order_status_history_previous_status_check");
            jdbcTemplate.execute("ALTER TABLE order_status_history DROP CONSTRAINT IF EXISTS order_status_history_new_status_check");
            logger.info("Checked and safely dropped legacy order status check constraints.");
        } catch (Exception e) {
            logger.debug("Constraint drop check: {}", e.getMessage());
        }

        try {
            // Ensure column data types are standard VARCHAR(255)
            jdbcTemplate.execute("ALTER TABLE order_status_history ALTER COLUMN new_status SET DATA TYPE VARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE order_status_history ALTER COLUMN previous_status SET DATA TYPE VARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE orders ALTER COLUMN status SET DATA TYPE VARCHAR(255)");
        } catch (Exception e) {
            // Some dialects use TYPE instead of SET DATA TYPE
            try {
                jdbcTemplate.execute("ALTER TABLE order_status_history ALTER COLUMN new_status TYPE VARCHAR(255)");
                jdbcTemplate.execute("ALTER TABLE order_status_history ALTER COLUMN previous_status TYPE VARCHAR(255)");
                jdbcTemplate.execute("ALTER TABLE orders ALTER COLUMN status TYPE VARCHAR(255)");
            } catch (Exception ex) {
                logger.debug("Column alter check: {}", ex.getMessage());
            }
        }
    }
}
