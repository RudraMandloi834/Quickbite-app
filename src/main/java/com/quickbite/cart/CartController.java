package com.quickbite.cart;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/carts")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Cart createCart(@RequestBody CreateCartRequest request) {
        validateCreateCartRequest(request);
        return cartService.createCart(request);
    }

    @PostMapping("/{cartId}/items")
    @ResponseStatus(HttpStatus.CREATED)
    public CartItem addItem(@PathVariable Long cartId, @RequestBody AddCartItemRequest request) {
        validateAddCartItemRequest(request);
        return cartService.addItem(cartId, request);
    }

    @GetMapping("/{cartId}")
    public Cart getCart(@PathVariable Long cartId) {
        return cartService.getCart(cartId);
    }

    private void validateCreateCartRequest(CreateCartRequest request) {
        if (request.customerId() == null || request.customerId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customer ID must be greater than 0");
        }
        if (!request.customerId().equals(com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access another user's resources");
        }
        if (request.restaurantId() == null || request.restaurantId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Restaurant ID must be greater than 0");
        }
    }

    private void validateAddCartItemRequest(AddCartItemRequest request) {
        if (request.menuItemId() == null || request.menuItemId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Menu item ID must be greater than 0");
        }
        if (request.quantity() == null || request.quantity() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be greater than 0");
        }
    }
}
