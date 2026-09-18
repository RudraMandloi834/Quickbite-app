package com.quickbite.customer;

import com.quickbite.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/customers/me/password")
public class CustomerPasswordController {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    public CustomerPasswordController(CustomerRepository customerRepository, PasswordEncoder passwordEncoder) {
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.OK)
    public void updatePassword(@RequestBody UpdatePasswordRequest request) {
        Long userId = SecurityUtils.getAuthenticatedCustomerId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthenticated");
        }

        Customer customer = customerRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        if (!passwordEncoder.matches(request.currentPassword(), customer.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid current password");
        }

        customer.setPassword(passwordEncoder.encode(request.newPassword()));
        customerRepository.save(customer);
    }
}
