package com.quickbite.cart;

import java.math.BigDecimal;
import java.util.List;

import com.quickbite.customer.CustomerRepository;
import com.quickbite.menu.MenuItem;
import com.quickbite.menu.MenuItemRepository;
import com.quickbite.restaurant.RestaurantRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final MenuItemRepository menuItemRepository;
    private final RestaurantRepository restaurantRepository;
    private final CustomerRepository customerRepository;

    public CartService(
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            MenuItemRepository menuItemRepository,
            RestaurantRepository restaurantRepository,
            CustomerRepository customerRepository
    ) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.menuItemRepository = menuItemRepository;
        this.restaurantRepository = restaurantRepository;
        this.customerRepository = customerRepository;
    }

    public Cart createCart(CreateCartRequest request) {
        if (!customerRepository.existsById(request.customerId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found");
        }
        if (!restaurantRepository.existsById(request.restaurantId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Restaurant not found");
        }

        return cartRepository.save(new Cart(request.customerId(), request.restaurantId()));
    }

    @Transactional
    public CartItem addItem(Long cartId, AddCartItemRequest request) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart not found"));
        if (!cart.getCustomerId().equals(com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        MenuItem menuItem = menuItemRepository.findById(request.menuItemId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu item not found"));

        if (!menuItem.getRestaurantId().equals(cart.getRestaurantId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Menu item belongs to a different restaurant");
        }
        if (!menuItem.isAvailable()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Menu item is not available");
        }

        CartItem cartItem = cartItemRepository.save(new CartItem(
                cartId,
                menuItem.getId(),
                request.quantity(),
                menuItem.getPrice()
        ));
        updateTotalAmount(cart);
        return cartItem;
    }

    public Cart getCart(Long cartId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart not found"));
        if (!cart.getCustomerId().equals(com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        cart.setItems(cartItemRepository.findByCartId(cartId));
        return cart;
    }

    private void updateTotalAmount(Cart cart) {
        BigDecimal totalAmount = cartItemRepository.findByCartId(cart.getId()).stream()
                .map(CartItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        cart.setTotalAmount(totalAmount);
        cartRepository.save(cart);
    }
}
