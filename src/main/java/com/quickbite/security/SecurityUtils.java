package com.quickbite.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

public class SecurityUtils {
    public static Long getAuthenticatedCustomerId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            return userDetails.getCustomerId();
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
    }

    public static List<SimpleGrantedAuthority> getAuthoritiesForRole(String role) {
        if (role == null || role.isBlank()) {
            return List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"));
        }
        String clean = role.toUpperCase();
        if (clean.startsWith("ROLE_")) {
            clean = clean.substring(5);
        }
        return switch (clean) {
            case "OPERATOR", "ADMIN" -> List.of(
                    new SimpleGrantedAuthority("ROLE_OPERATOR"),
                    new SimpleGrantedAuthority("ROLE_ADMIN")
            );
            case "RESTAURANT_PARTNER", "RESTAURANT_OWNER" -> List.of(
                    new SimpleGrantedAuthority("ROLE_RESTAURANT_PARTNER"),
                    new SimpleGrantedAuthority("ROLE_RESTAURANT_OWNER")
            );
            case "DRIVER", "DELIVERY_DRIVER" -> List.of(
                    new SimpleGrantedAuthority("ROLE_DRIVER"),
                    new SimpleGrantedAuthority("ROLE_DELIVERY_DRIVER")
            );
            default -> List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"));
        };
    }

    public static List<String> getRoleNamesForRole(String role) {
        return getAuthoritiesForRole(role).stream()
                .map(SimpleGrantedAuthority::getAuthority)
                .toList();
    }
}
