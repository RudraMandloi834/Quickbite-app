import re

file_path = "src/main/java/com/quickbite/order/OrderController.java"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("private final OrderService orderService;", "private final OrderService orderService;\n    private final OrderLifecycleService lifecycleService;")
content = content.replace("public OrderController(OrderService orderService) {", "public OrderController(OrderService orderService, OrderLifecycleService lifecycleService) {")
content = content.replace("this.orderService = orderService;", "this.orderService = orderService;\n        this.lifecycleService = lifecycleService;")

content = content.replace("return orderService.cancelOrder(orderId);", """Long userId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        return lifecycleService.transitionOrder(orderId, OrderStatus.CANCELLED, userId, "ROLE_CUSTOMER", "User cancelled order");""")

with open(file_path, "w") as f:
    f.write(content)

