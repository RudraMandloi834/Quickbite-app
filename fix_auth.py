import os

def insert_auth_check(filepath, search_str, replacement):
    with open(filepath, 'r') as f:
        content = f.read()
    content = content.replace(search_str, replacement)
    with open(filepath, 'w') as f:
        f.write(content)

# CustomerController
cc_path = "src/main/java/com/quickbite/customer/CustomerController.java"
insert_auth_check(cc_path, 
"""Long authId = SecurityUtils.getAuthenticatedCustomerId();
        if (!customerId.equals(authId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access another user's profile");
        }""",
"""Long authId = SecurityUtils.getAuthenticatedCustomerId();
        boolean isOperator = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OPERATOR"));
        if (!customerId.equals(authId) && !isOperator) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access another user's profile");
        }"""
)

# CartController
cart_path = "src/main/java/com/quickbite/cart/CartController.java"
insert_auth_check(cart_path,
"""if (!cart.getCustomerId().equals(com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access another user's cart");
        }""",
"""boolean isOperator = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OPERATOR"));
        if (!cart.getCustomerId().equals(com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId()) && !isOperator) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access another user's cart");
        }"""
)

