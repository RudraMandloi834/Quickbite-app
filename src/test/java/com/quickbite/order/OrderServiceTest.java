package com.quickbite.order;

import com.quickbite.cart.Cart;
import com.quickbite.cart.CartItem;
import com.quickbite.cart.CartItemRepository;
import com.quickbite.cart.CartRepository;
import com.quickbite.customer.Customer;
import com.quickbite.customer.CustomerRepository;
import com.quickbite.menu.MenuItem;
import com.quickbite.menu.MenuItemRepository;
import com.quickbite.payment.Payment;
import com.quickbite.payment.PaymentRepository;
import com.quickbite.payment.PaymentStatus;
import com.quickbite.restaurant.Restaurant;
import com.quickbite.restaurant.RestaurantRepository;
import com.quickbite.restaurant.RestaurantStatus;
import com.quickbite.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private MenuItemRepository menuItemRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private RestaurantRepository restaurantRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderEventPublisher orderEventPublisher;

    private OrderService orderService;

    private final Long customerId = 1L;
    private final Long restaurantId = 10L;
    private final Long cartId = 5L;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new CustomUserDetails("customer@test.com", "pass", Collections.emptyList(), customerId), null));

        orderService = new OrderService(
                orderRepository,
                orderItemRepository,
                cartRepository,
                cartItemRepository,
                menuItemRepository,
                customerRepository,
                restaurantRepository,
                paymentRepository,
                orderEventPublisher
        );
    }

    @Test
    @DisplayName("Place COD Order: Recalculates total from DB, creates PLACED order & PENDING payment, clears cart items")
    void testCreateOrderFromCart_COD_Success() {
        Cart cart = new Cart(customerId, restaurantId);
        cart.setId(cartId);
        cart.setTotalAmount(BigDecimal.valueOf(50)); // Stale frontend price

        CartItem cartItem = new CartItem(cartId, 101L, 2, BigDecimal.valueOf(25));
        cartItem.setId(1L);

        MenuItem menuItem = new MenuItem(restaurantId, "Paneer Butter Masala", "Tasty", BigDecimal.valueOf(180), true);
        Restaurant restaurant = new Restaurant("Curry House", "North Indian", "Main Area", 4.5, "123 Street", "Mumbai", "Main Area", 19.0, 72.8, "10-10", 5.0, "img");
        restaurant.setStatus(RestaurantStatus.APPROVED);

        when(cartRepository.findById(cartId)).thenReturn(Optional.of(cart));
        when(customerRepository.existsById(customerId)).thenReturn(true);
        when(cartItemRepository.findByCartId(cartId)).thenReturn(List.of(cartItem));
        when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));
        when(menuItemRepository.findById(101L)).thenReturn(Optional.of(menuItem));

        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            return o;
        });

        Order result = orderService.createOrderFromCart(cartId, "COD");

        assertNotNull(result);
        assertEquals(OrderStatus.PLACED, result.getStatus());
        assertEquals("COD", result.getPaymentMethod());
        assertEquals("PENDING", result.getPaymentStatus());
        // Recalculated: 2 * 180 = 360
        assertEquals(BigDecimal.valueOf(360), result.getTotalAmount());

        // Verify items were saved and cart items deleted
        verify(orderItemRepository).saveAll(anyList());
        verify(cartItemRepository).deleteAll(anyList());

        // Verify COD Payment record created
        ArgumentCaptor<Payment> paymentCaptor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(paymentCaptor.capture());
        Payment savedPayment = paymentCaptor.getValue();
        assertEquals(PaymentStatus.PENDING, savedPayment.getStatus());
        assertEquals(BigDecimal.valueOf(360), savedPayment.getAmount());

        // Verify event published
        verify(orderEventPublisher).publishOrderCreated(any(Order.class));
    }

    @Test
    @DisplayName("Price Tampering Protection: Backend enforces DB prices over frontend supplied prices")
    void testPriceTamperingProtection() {
        Cart cart = new Cart(customerId, restaurantId);
        cart.setId(cartId);
        cart.setTotalAmount(BigDecimal.valueOf(1)); // Tampered low price

        CartItem item = new CartItem(cartId, 101L, 3, BigDecimal.valueOf(0.33));
        MenuItem realItem = new MenuItem(restaurantId, "Biryani", "Delicious", BigDecimal.valueOf(250), true);
        Restaurant restaurant = new Restaurant("Biryani Hub", "Mughlai", "Main Area", 4.6, "456 Street", "Hyderabad", "Main Area", 17.3, 78.4, "10-10", 5.0, "img");
        restaurant.setStatus(RestaurantStatus.APPROVED);

        when(cartRepository.findById(cartId)).thenReturn(Optional.of(cart));
        when(customerRepository.existsById(customerId)).thenReturn(true);
        when(cartItemRepository.findByCartId(cartId)).thenReturn(List.of(item));
        when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));
        when(menuItemRepository.findById(101L)).thenReturn(Optional.of(realItem));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        Order order = orderService.createOrderFromCart(cartId, "CARD");

        assertEquals(BigDecimal.valueOf(750), order.getTotalAmount(), "Must equal 3 * 250");
    }

    @Test
    @DisplayName("Empty Cart: Throws BAD_REQUEST if cart contains no items and no recent order exists")
    void testEmptyCartThrowsBadRequest() {
        Cart cart = new Cart(customerId, restaurantId);
        cart.setId(cartId);

        when(cartRepository.findById(cartId)).thenReturn(Optional.of(cart));
        when(customerRepository.existsById(customerId)).thenReturn(true);
        when(cartItemRepository.findByCartId(cartId)).thenReturn(Collections.emptyList());
        when(orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)).thenReturn(Collections.emptyList());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> orderService.createOrderFromCart(cartId, "COD"));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Cart must contain at least one item"));
    }

    @Test
    @DisplayName("Idempotent Retry: Returning existing placed order when retrying checkout after timeout")
    void testIdempotentRetryReturnsExistingOrder() {
        Cart cart = new Cart(customerId, restaurantId);
        cart.setId(cartId);

        Order existingOrder = new Order(customerId, restaurantId, BigDecimal.valueOf(400));
        existingOrder.setStatus(OrderStatus.PLACED);
        existingOrder.setPaymentMethod("COD");

        when(cartRepository.findById(cartId)).thenReturn(Optional.of(cart));
        when(customerRepository.existsById(customerId)).thenReturn(true);
        when(cartItemRepository.findByCartId(cartId)).thenReturn(Collections.emptyList());
        when(orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)).thenReturn(List.of(existingOrder));

        Order result = orderService.createOrderFromCart(cartId, "COD");

        assertNotNull(result);
        assertEquals(OrderStatus.PLACED, result.getStatus());
        verify(orderRepository, never()).save(any());
        verify(cartItemRepository, never()).deleteAll(anyList());
    }

    @Test
    @DisplayName("Unavailable Restaurant: Throws BAD_REQUEST if restaurant is SUSPENDED or REJECTED")
    void testUnavailableRestaurantThrowsBadRequest() {
        Cart cart = new Cart(customerId, restaurantId);
        cart.setId(cartId);
        CartItem cartItem = new CartItem(cartId, 101L, 1, BigDecimal.valueOf(100));

        Restaurant suspendedRest = new Restaurant("Closed Rest", "Cuisine", "Area", 3.0, "Addr", "City", "Area", 12.0, 77.0, "Hours", 5.0, "img");
        suspendedRest.setStatus(RestaurantStatus.SUSPENDED);

        when(cartRepository.findById(cartId)).thenReturn(Optional.of(cart));
        when(customerRepository.existsById(customerId)).thenReturn(true);
        when(cartItemRepository.findByCartId(cartId)).thenReturn(List.of(cartItem));
        when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(suspendedRest));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> orderService.createOrderFromCart(cartId, "COD"));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("unavailable for orders"));
    }

    @Test
    @DisplayName("Item From Different Restaurant: Throws BAD_REQUEST if item belongs to another restaurant")
    void testItemFromDifferentRestaurantThrowsBadRequest() {
        Cart cart = new Cart(customerId, restaurantId);
        cart.setId(cartId);
        CartItem cartItem = new CartItem(cartId, 101L, 1, BigDecimal.valueOf(100));

        Restaurant restaurant = new Restaurant("Rest A", "Cuisine", "Area", 4.0, "Addr", "City", "Area", 12.0, 77.0, "Hours", 5.0, "img");
        restaurant.setStatus(RestaurantStatus.APPROVED);

        MenuItem otherItem = new MenuItem(999L, "Alien Item", "Desc", BigDecimal.valueOf(100), true);

        when(cartRepository.findById(cartId)).thenReturn(Optional.of(cart));
        when(customerRepository.existsById(customerId)).thenReturn(true);
        when(cartItemRepository.findByCartId(cartId)).thenReturn(List.of(cartItem));
        when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));
        when(menuItemRepository.findById(101L)).thenReturn(Optional.of(otherItem));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> orderService.createOrderFromCart(cartId, "COD"));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("does not belong to the order restaurant"));
    }

    @Test
    @DisplayName("Item Unavailable: Throws BAD_REQUEST if menuItem is marked unavailable")
    void testUnavailableItemThrowsBadRequest() {
        Cart cart = new Cart(customerId, restaurantId);
        cart.setId(cartId);
        CartItem cartItem = new CartItem(cartId, 101L, 1, BigDecimal.valueOf(100));

        Restaurant restaurant = new Restaurant("Rest A", "Cuisine", "Area", 4.0, "Addr", "City", "Area", 12.0, 77.0, "Hours", 5.0, "img");
        restaurant.setStatus(RestaurantStatus.APPROVED);

        MenuItem soldOutItem = new MenuItem(restaurantId, "Sold Out Dish", "Desc", BigDecimal.valueOf(100), false);

        when(cartRepository.findById(cartId)).thenReturn(Optional.of(cart));
        when(customerRepository.existsById(customerId)).thenReturn(true);
        when(cartItemRepository.findByCartId(cartId)).thenReturn(List.of(cartItem));
        when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));
        when(menuItemRepository.findById(101L)).thenReturn(Optional.of(soldOutItem));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> orderService.createOrderFromCart(cartId, "COD"));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("currently unavailable"));
    }
}
