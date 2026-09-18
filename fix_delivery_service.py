import re

file_path = "src/main/java/com/quickbite/delivery/DeliveryService.java"
with open(file_path, "r") as f:
    content = f.read()

# Replace the incorrect constructor
old_constructor = "public DeliveryService(DeliveryRepository deliveryRepository, OrderRepository orderRepository, RestaurantService restaurantService, org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate) {"
new_constructor = "public DeliveryService(DeliveryRepository deliveryRepository, OrderRepository orderRepository, RestaurantService restaurantService, org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate, DeliveryStatusHistoryRepository historyRepository) {"
content = content.replace(old_constructor, new_constructor)

with open(file_path, "w") as f:
    f.write(content)
