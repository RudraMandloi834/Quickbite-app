import re

file_path = "src/main/java/com/quickbite/order/RestaurantOrderService.java"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("private final OrderEventPublisher orderEventPublisher;", "private final OrderEventPublisher orderEventPublisher;\n    private final org.springframework.context.annotation.Lazy @org.springframework.beans.factory.annotation.Autowired OrderLifecycleService lifecycleService;")

update_old = """@Transactional
    public Order updateRestaurantOrderStatus(Long restaurantId, Long orderId, UpdateOrderStatusRequest request) {
        Order order = getRestaurantOrder(restaurantId, orderId); // Validates auth and ownership

        if (request.status() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required");
        }
        
        if (request.status() == OrderStatus.CANCELLED && order.getStatus() != OrderStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending orders can be cancelled");
        }
        
        order.setStatus(request.status());
        orderEventPublisher.publishOrderStatusUpdated(order);
        return orderRepository.save(order);
    }"""
update_new = """@Transactional
    public Order updateRestaurantOrderStatus(Long restaurantId, Long orderId, UpdateOrderStatusRequest request) {
        Order order = getRestaurantOrder(restaurantId, orderId); // Validates auth and ownership

        if (request.status() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required");
        }
        
        Long userId = SecurityUtils.getAuthenticatedCustomerId();
        return lifecycleService.transitionOrder(orderId, request.status(), userId, "ROLE_RESTAURANT_PARTNER", "Updated by restaurant");
    }"""
content = content.replace(update_old, update_new)

with open(file_path, "w") as f:
    f.write(content)

