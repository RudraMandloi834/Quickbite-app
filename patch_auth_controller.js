const fs = require('fs');
let code = fs.readFileSync('src/main/java/com/quickbite/auth/AuthController.java', 'utf8');

const imports = `import java.util.UUID;
import java.time.LocalDateTime;
import com.quickbite.auth.PasswordResetToken;
import com.quickbite.auth.PasswordResetTokenRepository;
`;

if (!code.includes('PasswordResetTokenRepository')) {
    code = code.replace(/import org.springframework.web.server.ResponseStatusException;/, `import org.springframework.web.server.ResponseStatusException;
${imports}`);
    
    code = code.replace(/private final AuthenticationManager authenticationManager;/, `private final AuthenticationManager authenticationManager;
    private final PasswordResetTokenRepository passwordResetTokenRepository;`);
    
    code = code.replace(/public AuthController\(/, `public AuthController(CustomerRepository customerRepository, PasswordEncoder passwordEncoder, JwtService jwtService, AuthenticationManager authenticationManager, PasswordResetTokenRepository passwordResetTokenRepository) {
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
    }
    
    // replaced constructor`);
    
    // Remove the original constructor which we just commented out implicitly by capturing up to it and overriding
    code = code.replace(/\/\/ replaced constructor[\s\S]*?this\.authenticationManager = authenticationManager;\n    \}/, '');

    const resetEndpoints = `
    @PostMapping("/forgot-password")
    public void forgotPassword(@RequestBody ForgotPasswordRequest request) {
        if (request.email() == null || request.email().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        
        customerRepository.findByEmail(request.email()).ifPresent(customer -> {
            String token = UUID.randomUUID().toString();
            PasswordResetToken resetToken = new PasswordResetToken(
                token, 
                customer, 
                LocalDateTime.now().plusHours(1)
            );
            passwordResetTokenRepository.save(resetToken);
            // In a real app, send email here
            System.out.println("Password reset token for " + customer.getEmail() + ": " + token);
        });
        // Always return 200 OK to prevent email enumeration
    }

    @PostMapping("/reset-password")
    public void resetPassword(@RequestBody ResetPasswordRequest request) {
        if (request.token() == null || request.token().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token is required");
        }
        if (request.newPassword() == null || request.newPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password is required");
        }
        
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.token())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid token"));
            
        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token has expired");
        }
        
        Customer customer = resetToken.getCustomer();
        customer.setPassword(passwordEncoder.encode(request.newPassword()));
        customerRepository.save(customer);
        
        passwordResetTokenRepository.delete(resetToken);
    }
`;
    code = code.replace(/}$/, resetEndpoints + '\n}');
    fs.writeFileSync('src/main/java/com/quickbite/auth/AuthController.java', code);
}
