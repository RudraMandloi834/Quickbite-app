import re

file_path = "src/main/java/com/quickbite/delivery/DeliveryService.java"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("private final RestaurantService restaurantService;", "private final RestaurantService restaurantService;\n    private final org.springframework.context.annotation.Lazy @org.springframework.beans.factory.annotation.Autowired com.quickbite.order.OrderLifecycleService orderLifecycleService;")

# Fix assignDriver
assign_old = """delivery.updateStatus(DeliveryStatus.ASSIGNED);
        Delivery saved = deliveryRepository.save(delivery);"""
assign_new = """delivery.updateStatus(DeliveryStatus.ASSIGNED);
        Delivery saved = deliveryRepository.save(delivery);
        orderLifecycleService.transitionOrder(saved.getOrderId(), com.quickbite.order.OrderStatus.DRIVER_ASSIGNED, driverId, "ROLE_DRIVER", "Driver assigned");"""
content = content.replace(assign_old, assign_new)

# Fix updateStatus
update_old = """delivery.updateStatus(status);
        Delivery saved = deliveryRepository.save(delivery);"""
update_new = """delivery.updateStatus(status);
        Delivery saved = deliveryRepository.save(delivery);
        com.quickbite.order.OrderStatus newOrderStatus = null;
        if (status == DeliveryStatus.PICKED_UP) newOrderStatus = com.quickbite.order.OrderStatus.PICKED_UP;
        if (status == DeliveryStatus.OUT_FOR_DELIVERY) newOrderStatus = com.quickbite.order.OrderStatus.OUT_FOR_DELIVERY;
        if (status == DeliveryStatus.DELIVERED) newOrderStatus = com.quickbite.order.OrderStatus.DELIVERED;
        if (newOrderStatus != null) {
            orderLifecycleService.transitionOrder(saved.getOrderId(), newOrderStatus, requestingDriverId, "ROLE_DRIVER", "Delivery update");
        }"""
content = content.replace(update_old, update_new)

with open(file_path, "w") as f:
    f.write(content)

