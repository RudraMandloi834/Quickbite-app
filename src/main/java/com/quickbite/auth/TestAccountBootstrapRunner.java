package com.quickbite.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(10)
public class TestAccountBootstrapRunner implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(TestAccountBootstrapRunner.class);

    private final TestAccountProvisioningService provisioningService;

    @Value("${quickbite.auth.seed-test-accounts:false}")
    private boolean seedTestAccounts;

    @Value("${quickbite.auth.test-password:}")
    private String testPassword;

    @Value("${quickbite.auth.admin-email:admin@test.com}")
    private String adminEmail;

    @Value("${quickbite.auth.admin-password:}")
    private String adminPassword;

    public TestAccountBootstrapRunner(TestAccountProvisioningService provisioningService) {
        this.provisioningService = provisioningService;
    }

    @Override
    public void run(String... args) throws Exception {
        if (seedTestAccounts && testPassword != null && !testPassword.isBlank()) {
            logger.info("Bootstrap test account seeding active. Provisioning 4 dedicated test accounts...");
            try {
                provisioningService.provisionTestAccounts(testPassword.trim());
                logger.info("Successfully provisioned dedicated test accounts for CUSTOMER, RESTAURANT_OWNER, DELIVERY_DRIVER, and ADMIN.");
            } catch (Exception e) {
                logger.error("Failed to seed test accounts on boot: {}", e.getMessage(), e);
            }
        } else if (adminPassword != null && !adminPassword.isBlank()) {
            if (!provisioningService.hasAdminAccount()) {
                logger.info("Provisioning initial administrator account for {}", adminEmail);
                try {
                    provisioningService.provisionAdmin("Platform Admin", adminEmail, adminPassword.trim());
                    logger.info("Successfully provisioned initial administrator account.");
                } catch (Exception e) {
                    logger.error("Failed to provision initial admin account on boot: {}", e.getMessage(), e);
                }
            } else {
                logger.info("Administrator account already exists; skipping automatic admin provisioning.");
            }
        } else {
            logger.debug("Automatic test account bootstrap inactive. Accounts can be provisioned via setup endpoints or env variables.");
        }
    }
}
