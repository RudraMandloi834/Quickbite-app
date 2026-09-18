import re

file_path = "src/main/java/com/quickbite/order/OrderService.java"
with open(file_path, "r") as f:
    content = f.read()

# Add OrderLifecycleService
content = content.replace("private final OrderEventPublisher orderEventPublisher;", "private final OrderEventPublisher orderEventPublisher;\n    private final org.springframework.context.annotation.Lazy @org.springframework.beans.factory.annotation.Autowired OrderLifecycleService lifecycleService;")

# In createOrderFromCart, do transition to PAYMENT_PENDING
create_code_old = """Order order = orderRepository.save(new Order(
                cart.getCustomerId(),
                cart.getRestaurantId(),
                cart.getTotalAmount()
        ));"""
create_code_new = """Order order = orderRepository.save(new Order(
                cart.getCustomerId(),
                cart.getRestaurantId(),
                cart.getTotalAmount()
        ));
        order = lifecycleService.transitionOrder(order.getId(), OrderStatus.PAYMENT_PENDING, cart.getCustomerId(), "ROLE_CUSTOMER", "Order initialized");"""
content = content.replace(create_code_old, create_code_new)

# Remove cancelOrder method
match = re.search(r'@Transactional\s+public Order cancelOrder.*?return orderRepository\.save\(order\);\n    }', content, re.DOTALL)
if match:
    content = content[:match.start()] + content[match.end():]

with open(file_path, "w") as f:
    f.write(content)

