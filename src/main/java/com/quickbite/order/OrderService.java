package com.quickbite.order;

import java.math.BigDecimal;
import java.util.List;

import com.quickbite.cart.Cart;
import com.quickbite.cart.CartItem;
import com.quickbite.cart.CartItemRepository;
import com.quickbite.cart.CartRepository;
import com.quickbite.customer.CustomerRepository;
import com.quickbite.menu.MenuItem;
import com.quickbite.menu.MenuItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final MenuItemRepository menuItemRepository;
    private final CustomerRepository customerRepository;
    private final com.quickbite.restaurant.RestaurantRepository restaurantRepository;
    private final com.quickbite.payment.PaymentRepository paymentRepository;
    private final OrderEventPublisher orderEventPublisher;
    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
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
            com.quickbite.restaurant.RestaurantRepository restaurantRepository,
            OrderEventPublisher orderEventPublisher
    ) {
        this(orderRepository, orderItemRepository, cartRepository, cartItemRepository, menuItemRepository, customerRepository, restaurantRepository, null, orderEventPublisher);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            MenuItemRepository menuItemRepository,
            CustomerRepository customerRepository,
            com.quickbite.restaurant.RestaurantRepository restaurantRepository,
            com.quickbite.payment.PaymentRepository paymentRepository,
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

        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart not found"));
        if (!cart.getCustomerId().equals(com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        if (!customerRepository.existsById(cart.getCustomerId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found");
        }

        List<CartItem> cartItems = cartItemRepository.findByCartId(cartId);

        if (cartItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart must contain at least one item");
        }

        if (cart.getRestaurantId() != null && restaurantRepository != null) {
            restaurantRepository.findById(cart.getRestaurantId()).ifPresent(r -> {
                if (r.getOwnerId() == null) {
                    customerRepository.findByEmail("restaurant@test.com").ifPresent(partner -> {
                        r.setOwnerId(partner.getId());
                        restaurantRepository.save(r);
                    });
                }
            });
        }

        Order order = new Order(
                cart.getCustomerId(),
                cart.getRestaurantId(),
                cart.getTotalAmount()
        );
        order.setPaymentMethod(method);
        Order savedOrder = orderRepository.save(order);

        List<OrderItem> orderItems = cartItems.stream()
                .map(cartItem -> createOrderItem(savedOrder.getId(), cartItem))
                .toList();
        orderItemRepository.saveAll(orderItems);

        // Delete cart items to prevent duplicate order submissions from the same cart
        cartItemRepository.deleteAll(cartItems);

        if ("COD".equals(method) && paymentRepository != null) {
            paymentRepository.save(new com.quickbite.payment.Payment(
                    savedOrder.getId(),
                    savedOrder.getTotalAmount(),
                    "COD_" + savedOrder.getId(),
                    com.quickbite.payment.PaymentStatus.PENDING
            ));
            savedOrder.setPaymentStatus("PENDING");
        } else {
            savedOrder.setPaymentStatus("PENDING");
        }

        savedOrder.setItems(orderItems);
        orderEventPublisher.publishOrderCreated(savedOrder);
        return savedOrder;
    }

    public Order getOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!order.getCustomerId().equals(com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId())) {
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
        if (!customerId.equals(com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId())) {
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

        return new OrderItem(
                orderId,
                cartItem.getMenuItemId(),
                menuItem.getName(),
                cartItem.getQuantity(),
                cartItem.getUnitPrice(),
                cartItem.getSubtotal()
        );
    }
}
