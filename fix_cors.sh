#!/bin/bash
sed -i 's/.requestMatchers("\/api\/health").permitAll()/.requestMatchers("\/api\/health").permitAll()\n                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "\/**").permitAll()/g' src/main/java/com/quickbite/security/SecurityConfig.java
