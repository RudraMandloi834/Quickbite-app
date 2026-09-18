import re

file_path = "src/main/java/com/quickbite/delivery/DeliveryService.java"
with open(file_path, "r") as f:
    content = f.read()

# Add repository to constructor
content = content.replace("private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;",
                          "private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;\n    private final DeliveryStatusHistoryRepository historyRepository;")

# Constructor
old_constructor = "public DeliveryService(DeliveryRepository deliveryRepository, com.quickbite.order.OrderRepository orderRepository, com.quickbite.restaurant.RestaurantService restaurantService, org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate) {"
new_constructor = "public DeliveryService(DeliveryRepository deliveryRepository, com.quickbite.order.OrderRepository orderRepository, com.quickbite.restaurant.RestaurantService restaurantService, org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate, DeliveryStatusHistoryRepository historyRepository) {"
content = content.replace(old_constructor, new_constructor)

# Constructor body
content = content.replace("this.messagingTemplate = messagingTemplate;", "this.messagingTemplate = messagingTemplate;\n        this.historyRepository = historyRepository;")

# In createDeliveryForOrder
old_create = """        return deliveryRepository.save(new Delivery(
                orderId,
                null,
                null,
                DeliveryStatus.AVAILABLE
        ));"""
new_create = """        Delivery delivery = deliveryRepository.save(new Delivery(
                orderId,
                null,
                null,
                DeliveryStatus.AVAILABLE
        ));
        Long userId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        String role = "ROLE_SYSTEM";
        historyRepository.save(new DeliveryStatusHistory(delivery.getId(), null, DeliveryStatus.AVAILABLE, userId, role, "Delivery created"));
        return delivery;"""
content = content.replace(old_create, new_create)

# In assignDriver
old_assign = """        delivery.setDriver(driverId, driverName, driverPhone);
        delivery.updateStatus(DeliveryStatus.ASSIGNED);
        Delivery saved = deliveryRepository.save(delivery);"""
new_assign = """        DeliveryStatus previousStatus = delivery.getStatus();
        delivery.setDriver(driverId, driverName, driverPhone);
        delivery.updateStatus(DeliveryStatus.ASSIGNED);
        Delivery saved = deliveryRepository.save(delivery);
        historyRepository.save(new DeliveryStatusHistory(saved.getId(), previousStatus, DeliveryStatus.ASSIGNED, driverId, "ROLE_DRIVER", "Driver assigned"));"""
content = content.replace(old_assign, new_assign)

# In updateStatus
old_update = """        delivery.updateStatus(status);
        Delivery saved = deliveryRepository.save(delivery);"""
new_update = """        DeliveryStatus previousStatus = delivery.getStatus();
        delivery.updateStatus(status);
        Delivery saved = deliveryRepository.save(delivery);
        Long userId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        historyRepository.save(new DeliveryStatusHistory(saved.getId(), previousStatus, status, userId, "ROLE_DRIVER", "Delivery update"));"""
content = content.replace(old_update, new_update)

with open(file_path, "w") as f:
    f.write(content)
