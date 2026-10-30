package com.quickbite;

import com.quickbite.auth.TestAccountProvisioningService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
@Order(5)
public class DevDataSeeder implements CommandLineRunner {

    private final TestAccountProvisioningService provisioningService;

    public DevDataSeeder(TestAccountProvisioningService provisioningService) {
        this.provisioningService = provisioningService;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("Starting development data seeder...");
        provisioningService.provisionTestAccounts("dev123");
        System.out.println("Development data seeding complete! Password for all accounts is: dev123");
    }
}
