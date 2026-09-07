#!/bin/bash
# Patch CartService
sed -i 's/Cart cart = cartRepository.findById(cartId)/Cart cart = cartRepository.findById(cartId)/g' src/main/java/com/quickbite/cart/CartService.java
# It's easier to just use sed to insert the ownership check right after the cart is fetched.
sed -i '/orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart not found"));/a \
        if (!cart.getCustomerId().equals(com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId())) {\
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");\
        }' src/main/java/com/quickbite/cart/CartService.java

# Patch OrderService
sed -i '/orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart not found"));/a \
        if (!cart.getCustomerId().equals(com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId())) {\
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");\
        }' src/main/java/com/quickbite/order/OrderService.java

sed -i '/orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));/a \
        if (!order.getCustomerId().equals(com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId())) {\
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");\
        }' src/main/java/com/quickbite/order/OrderService.java

# Patch CustomerService
sed -i '/orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));/a \
        if (!customerId.equals(com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId())) {\
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");\
        }' src/main/java/com/quickbite/customer/CustomerService.java

sed -i '/public List<Customer> getAllCustomers() {/a \
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");' src/main/java/com/quickbite/customer/CustomerService.java

