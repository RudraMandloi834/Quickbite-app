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
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.menuItemRepository = menuItemRepository;
        this.customerRepository = customerRepository;
        this.orderEventPublisher = orderEventPublisher;
    }

    @Transactional
    public Order createOrderFromCart(Long cartId) {
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

        Order order = orderRepository.save(new Order(
                cart.getCustomerId(),
                cart.getRestaurantId(),
                cart.getTotalAmount()
        ));
        Order finalOrder = lifecycleService.transitionOrder(order.getId(), OrderStatus.PAYMENT_PENDING, cart.getCustomerId(), "ROLE_CUSTOMER", "Order initialized");

        List<OrderItem> orderItems = cartItems.stream()
                .map(cartItem -> createOrderItem(finalOrder.getId(), cartItem))
                .toList();
        orderItemRepository.saveAll(orderItems);



        finalOrder.setItems(orderItems);
        orderEventPublisher.publishOrderCreated(finalOrder);
        return finalOrder;
    }

    public Order getOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!order.getCustomerId().equals(com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        order.setItems(orderItemRepository.findByOrderId(orderId));
        orderEventPublisher.publishOrderCreated(order);
        return order;
    }

    public List<Order> getCustomerOrders(Long customerId) {
        if (!customerId.equals(com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        List<Order> orders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        for (Order order : orders) {
            order.setItems(orderItemRepository.findByOrderId(order.getId()));
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
