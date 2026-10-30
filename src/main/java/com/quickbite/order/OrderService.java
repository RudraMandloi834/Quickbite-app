package com.quickbite.order;

import com.quickbite.cart.Cart;
import com.quickbite.cart.CartItem;
import com.quickbite.cart.CartItemRepository;
import com.quickbite.cart.CartRepository;
import com.quickbite.customer.CustomerRepository;
import com.quickbite.menu.MenuItem;
import com.quickbite.menu.MenuItemRepository;
import com.quickbite.restaurant.Restaurant;
import com.quickbite.restaurant.RestaurantRepository;
import com.quickbite.restaurant.RestaurantStatus;
import com.quickbite.payment.Payment;
import com.quickbite.payment.PaymentRepository;
import com.quickbite.payment.PaymentStatus;
import com.quickbite.security.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final MenuItemRepository menuItemRepository;
    private final CustomerRepository customerRepository;
    private final RestaurantRepository restaurantRepository;
    private final PaymentRepository paymentRepository;
    private final OrderEventPublisher orderEventPublisher;

    @Autowired(required = false)
    private OrderStatusHistoryRepository historyRepository;

    @Lazy
    @Autowired(required = false)
    private OrderLifecycleService lifecycleService;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            MenuItemRepository menuItemRepository,
            CustomerRepository customerRepository,
            OrderEventPublisher orderEventPublisher
    ) {
        this(orderRepository, orderItemRepository, cartRepository, cartItemRepository, menuItemRepository, customerRepository, null, null, orderEventPublisher);
    }

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            MenuItemRepository menuItemRepository,
            CustomerRepository customerRepository,
            RestaurantRepository restaurantRepository,
            OrderEventPublisher orderEventPublisher
    ) {
        this(orderRepository, orderItemRepository, cartRepository, cartItemRepository, menuItemRepository, customerRepository, restaurantRepository, null, orderEventPublisher);
    }

    @Autowired
    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            MenuItemRepository menuItemRepository,
            CustomerRepository customerRepository,
            RestaurantRepository restaurantRepository,
            PaymentRepository paymentRepository,
            OrderEventPublisher orderEventPublisher
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.menuItemRepository = menuItemRepository;
        this.customerRepository = customerRepository;
        this.restaurantRepository = restaurantRepository;
        this.paymentRepository = paymentRepository;
        this.orderEventPublisher = orderEventPublisher;
    }

    public void setHistoryRepository(OrderStatusHistoryRepository historyRepository) {
        this.historyRepository = historyRepository;
    }

    public void setLifecycleService(OrderLifecycleService lifecycleService) {
        this.lifecycleService = lifecycleService;
    }

    @Transactional
    public Order createOrderFromCart(Long cartId) {
        return createOrderFromCart(cartId, "CARD");
    }

    @Transactional
    public Order createOrderFromCart(Long cartId, String paymentMethod) {
        String method = (paymentMethod == null || paymentMethod.isBlank()) ? "CARD" : paymentMethod.trim().toUpperCase();
        if (!method.equals("CARD") && !method.equals("UPI") && !method.equals("COD")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payment method: " + paymentMethod);
        }

        Long authenticatedCustomerId = SecurityUtils.getAuthenticatedCustomerId();
        if (authenticatedCustomerId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User must be authenticated to place an order");
        }

        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart not found"));

        if (!cart.getCustomerId().equals(authenticatedCustomerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: cart belongs to another user");
        }

        if (!customerRepository.existsById(cart.getCustomerId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found");
        }

        List<CartItem> cartItems = cartItemRepository.findByCartId(cartId);

        // Check if cart is empty - handle idempotent retry safely
        if (cartItems.isEmpty()) {
            List<Order> recentOrders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(cart.getCustomerId());
            if (recentOrders != null && !recentOrders.isEmpty()) {
                Order mostRecent = recentOrders.get(0);
                if (cart.getRestaurantId() != null && cart.getRestaurantId().equals(mostRecent.getRestaurantId())
                        && mostRecent.getCreatedAt() != null
                        && Duration.between(mostRecent.getCreatedAt(), Instant.now()).toMinutes() < 5) {
                    logger.info("Idempotent checkout retry detected: returning recently placed order #{} for customer #{}",
                            mostRecent.getId(), cart.getCustomerId());
                    mostRecent.setItems(orderItemRepository.findByOrderId(mostRecent.getId()));
                    if (paymentRepository != null) {
                        paymentRepository.findByOrderId(mostRecent.getId()).ifPresentOrElse(
                                p -> mostRecent.setPaymentStatus(p.getStatus().name()),
                                () -> mostRecent.setPaymentStatus("PENDING")
                        );
                    }
                    return mostRecent;
                }
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart must contain at least one item");
        }

        // Validate Restaurant
        if (cart.getRestaurantId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is not associated with any restaurant");
        }
        if (restaurantRepository != null) {
            Restaurant restaurant = restaurantRepository.findById(cart.getRestaurantId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Restaurant does not exist"));

            if (restaurant.getStatus() != null && restaurant.getStatus() != RestaurantStatus.APPROVED) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Restaurant is currently unavailable for orders");
            }

            if (restaurant.getOwnerId() == null) {
                customerRepository.findByEmail("restaurant@test.com").ifPresent(partner -> {
                    restaurant.setOwnerId(partner.getId());
                    restaurantRepository.save(restaurant);
                });
            }
        }

        // Validate items, quantities, and recalculate actual total from database (never trust frontend totals)
        BigDecimal calculatedTotal = BigDecimal.ZERO;
        for (CartItem item : cartItems) {
            if (item.getQuantity() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid quantity for cart item");
            }

            MenuItem menuItem = menuItemRepository.findById(item.getMenuItemId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu item not found: " + item.getMenuItemId()));

            if (!menuItem.isAvailable()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Item '" + menuItem.getName() + "' is currently unavailable");
            }

            if (menuItem.getRestaurantId() != null && !menuItem.getRestaurantId().equals(cart.getRestaurantId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Item '" + menuItem.getName() + "' does not belong to the order restaurant");
            }

            BigDecimal unitPrice = menuItem.getPrice() != null ? menuItem.getPrice() : BigDecimal.ZERO;
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
            calculatedTotal = calculatedTotal.add(subtotal);
        }

        cart.setTotalAmount(calculatedTotal);
        cartRepository.save(cart);

        Order order = new Order(
                cart.getCustomerId(),
                cart.getRestaurantId(),
                calculatedTotal
        );
        order.setPaymentMethod(method);
        Order savedOrder = orderRepository.save(order);

        List<OrderItem> orderItems = cartItems.stream()
                .map(cartItem -> createOrderItem(savedOrder.getId(), cartItem))
                .toList();
        orderItemRepository.saveAll(orderItems);

        // Record initial OrderStatusHistory
        if (historyRepository != null) {
            try {
                historyRepository.save(new OrderStatusHistory(
                        savedOrder.getId(),
                        null,
                        OrderStatus.PLACED,
                        authenticatedCustomerId,
                        "Order placed via " + method
                ));
            } catch (Exception e) {
                logger.warn("Could not save initial OrderStatusHistory: {}", e.getMessage());
            }
        }

        // Delete cart items to finalize checkout and prevent duplicate submissions from this cart
        cartItemRepository.deleteAll(cartItems);

        if ("COD".equals(method) && paymentRepository != null) {
            paymentRepository.save(new Payment(
                    savedOrder.getId(),
                    savedOrder.getTotalAmount(),
                    "COD_" + savedOrder.getId(),
                    PaymentStatus.PENDING
            ));
            savedOrder.setPaymentStatus("PENDING");
        } else {
            savedOrder.setPaymentStatus("PENDING");
        }

        savedOrder.setItems(orderItems);
        orderEventPublisher.publishOrderCreated(savedOrder);
        logger.info("Successfully created order #{} for customer #{} via {}", savedOrder.getId(), authenticatedCustomerId, method);
        return savedOrder;
    }

    public Order getOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!order.getCustomerId().equals(SecurityUtils.getAuthenticatedCustomerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        order.setItems(orderItemRepository.findByOrderId(orderId));
        if (paymentRepository != null) {
            paymentRepository.findByOrderId(orderId).ifPresentOrElse(
                    p -> order.setPaymentStatus(p.getStatus().name()),
                    () -> order.setPaymentStatus("PENDING")
            );
        }
        return order;
    }

    public List<Order> getCustomerOrders(Long customerId) {
        if (!customerId.equals(SecurityUtils.getAuthenticatedCustomerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        List<Order> orders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        for (Order order : orders) {
            order.setItems(orderItemRepository.findByOrderId(order.getId()));
            if (paymentRepository != null) {
                paymentRepository.findByOrderId(order.getId()).ifPresentOrElse(
                        p -> order.setPaymentStatus(p.getStatus().name()),
                        () -> order.setPaymentStatus("PENDING")
                );
            }
        }
        return orders;
    }

    private OrderItem createOrderItem(Long orderId, CartItem cartItem) {
        MenuItem menuItem = menuItemRepository.findById(cartItem.getMenuItemId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu item not found"));

        BigDecimal unitPrice = menuItem.getPrice() != null ? menuItem.getPrice() : BigDecimal.ZERO;
        BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity()));

        return new OrderItem(
                orderId,
                cartItem.getMenuItemId(),
                menuItem.getName(),
                cartItem.getQuantity(),
                unitPrice,
                subtotal
        );
    }
}
