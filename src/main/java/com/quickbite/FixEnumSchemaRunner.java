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
            // Drop check constraints explicitly by name
            jdbcTemplate.execute("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check");
            jdbcTemplate.execute("ALTER TABLE order_status_history DROP CONSTRAINT IF EXISTS order_status_history_previous_status_check");
            jdbcTemplate.execute("ALTER TABLE order_status_history DROP CONSTRAINT IF EXISTS order_status_history_new_status_check");
        } catch (Exception e) {
            logger.debug("Constraint drop check: {}", e.getMessage());
        }

        try {
            // Drop any dynamic/anonymous check constraints on orders and order_status_history (H2 & PostgreSQL)
            java.util.List<String> orderChecks = jdbcTemplate.queryForList(
                "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE UPPER(TABLE_NAME) = 'ORDERS' AND CONSTRAINT_TYPE = 'CHECK'",
                String.class
            );
            for (String cName : orderChecks) {
                try {
                    jdbcTemplate.execute("ALTER TABLE orders DROP CONSTRAINT " + cName);
                } catch (Exception ignored) {}
            }
            java.util.List<String> histChecks = jdbcTemplate.queryForList(
                "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE UPPER(TABLE_NAME) = 'ORDER_STATUS_HISTORY' AND CONSTRAINT_TYPE = 'CHECK'",
                String.class
            );
            for (String cName : histChecks) {
                try {
                    jdbcTemplate.execute("ALTER TABLE order_status_history DROP CONSTRAINT " + cName);
                } catch (Exception ignored) {}
            }
            logger.info("Checked and safely dropped legacy order status check constraints.");
        } catch (Exception e) {
            logger.debug("Dynamic constraint query: {}", e.getMessage());
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
