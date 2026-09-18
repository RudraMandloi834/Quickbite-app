import re

file_path = "src/main/java/com/quickbite/order/OrderService.java"
with open(file_path, "r") as f:
    content = f.read()

# Fix getOrder method
fix_old = """    public Order getOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!order.getCustomerId().equals(com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        order.setItems(orderItemRepository.findByOrderId(orderId));
        orderEventPublisher.publishOrderCreated(finalOrder);
        return finalOrder;
    }"""
fix_new = """    public Order getOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!order.getCustomerId().equals(com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        order.setItems(orderItemRepository.findByOrderId(orderId));
        orderEventPublisher.publishOrderCreated(order);
        return order;
    }"""
content = content.replace(fix_old, fix_new)

with open(file_path, "w") as f:
    f.write(content)
