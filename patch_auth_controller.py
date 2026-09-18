import re

file_path = "src/main/java/com/quickbite/auth/AuthController.java"
with open(file_path, "r") as f:
    content = f.read()

signup_old = """        Customer customer = new Customer(
                request.name(),
                request.email(),
                null,
                passwordEncoder.encode(request.password())
        );"""
signup_new = """        String role = request.role();
        if (role == null || role.isBlank()) {
            role = "ROLE_CUSTOMER";
        } else if (!role.startsWith("ROLE_")) {
            role = "ROLE_" + role.toUpperCase();
        }
        
        if (!role.equals("ROLE_CUSTOMER") && !role.equals("ROLE_RESTAURANT_PARTNER") && !role.equals("ROLE_DRIVER")) {
            role = "ROLE_CUSTOMER"; // Fallback to safe role
        }

        Customer customer = new Customer(
                request.name(),
                request.email(),
                null,
                passwordEncoder.encode(request.password()),
                role
        );"""
content = content.replace(signup_old, signup_new)

with open(file_path, "w") as f:
    f.write(content)
