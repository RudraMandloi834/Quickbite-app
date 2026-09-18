#!/bin/bash
sed -i 's/\.csrf(AbstractHttpConfigurer::disable)/.cors(cors -> cors.configurationSource(corsConfigurationSource()))\n            .csrf(AbstractHttpConfigurer::disable)/g' src/main/java/com/quickbite/security/SecurityConfig.java
