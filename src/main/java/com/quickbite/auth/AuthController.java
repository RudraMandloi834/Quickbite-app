package com.quickbite.auth;

import com.quickbite.customer.Customer;
import com.quickbite.customer.CustomerRepository;
import com.quickbite.security.JwtService;
import com.quickbite.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final TestAccountProvisioningService provisioningService;

    public AuthController(
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            PasswordResetTokenRepository passwordResetTokenRepository,
            TestAccountProvisioningService provisioningService) {
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.provisioningService = provisioningService;
    }

    public record SetupAdminRequest(String name, String email, String password) {}

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse signup(@RequestBody SignupRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
        }
        if (request.email() == null || request.email().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        if (request.password() == null || request.password().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required");
        }

        String email = request.email().trim().toLowerCase();
        if (customerRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        // Security check: NEVER grant admin/operator privileges via public signup
        String role = "ROLE_CUSTOMER";
        if (request.role() != null && !request.role().isBlank()) {
            String requested = request.role().trim().toUpperCase();
            if (requested.startsWith("ROLE_")) {
                requested = requested.substring(5);
            }
            if ("RESTAURANT_PARTNER".equals(requested) || "RESTAURANT_OWNER".equals(requested)) {
                role = "ROLE_RESTAURANT_PARTNER";
            } else if ("DRIVER".equals(requested) || "DELIVERY_DRIVER".equals(requested)) {
                role = "ROLE_DRIVER";
            } else {
                role = "ROLE_CUSTOMER";
            }
        }

        Customer customer = new Customer(
                request.name().trim(),
                email,
                null,
                passwordEncoder.encode(request.password()),
                role
        );
        customer = customerRepository.save(customer);

        List<String> roleNames = SecurityUtils.getRoleNamesForRole(customer.getRole());
        String token = jwtService.generateToken(customer.getEmail(), customer.getId(), customer.getRole(), roleNames);
        return new AuthResponse(token);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody AuthRequest request) {
        String identifier = request.email() != null ? request.email().trim() : "";
        if (identifier.isEmpty() || request.password() == null || request.password().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(identifier, request.password())
            );
        } catch (AuthenticationException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        Customer customer = customerRepository.findByEmailIgnoreCase(identifier)
                .or(() -> customerRepository.findByName(identifier))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        List<String> roleNames = SecurityUtils.getRoleNamesForRole(customer.getRole());
        String token = jwtService.generateToken(customer.getEmail(), customer.getId(), customer.getRole(), roleNames);
        return new AuthResponse(token);
    }

    @PostMapping("/setup-admin")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse setupInitialAdmin(@RequestBody SetupAdminRequest request) {
        if (request.email() == null || request.email().isBlank() || request.password() == null || request.password().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and password are required for admin setup");
        }

        if (provisioningService.hasAdminAccount()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Initial administrator has already been provisioned");
        }

        Customer admin = provisioningService.provisionAdmin(
                request.name() != null ? request.name() : "Platform Administrator",
                request.email(),
                request.password()
        );

        List<String> roleNames = SecurityUtils.getRoleNamesForRole(admin.getRole());
        String token = jwtService.generateToken(admin.getEmail(), admin.getId(), admin.getRole(), roleNames);
        return new AuthResponse(token);
    }
}
