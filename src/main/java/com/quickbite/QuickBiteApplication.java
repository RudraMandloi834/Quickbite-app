package com.quickbite;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class QuickBiteApplication {

    public static void main(String[] args) {
        SpringApplication.run(QuickBiteApplication.class, args);
    }
}
