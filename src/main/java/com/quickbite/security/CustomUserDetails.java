package com.quickbite.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;
import java.util.Collection;

public class CustomUserDetails extends User {
    private final Long customerId;

    public CustomUserDetails(String username, String password, Collection<? extends GrantedAuthority> authorities, Long customerId) {
        super(username, password, authorities);
        this.customerId = customerId;
    }

    public Long getCustomerId() {
        return customerId;
    }
}
