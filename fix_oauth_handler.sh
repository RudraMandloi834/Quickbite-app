#!/bin/bash
sed -i 's/String token = jwtService.generateToken(customer.getEmail(), customer.getId());/String token = jwtService.generateToken(customer.getEmail(), customer.getId(), customer.getRole());/g' src/main/java/com/quickbite/security/OAuth2AuthenticationSuccessHandler.java
