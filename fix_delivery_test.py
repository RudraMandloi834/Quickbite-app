import re

file_path = "src/test/java/com/quickbite/delivery/DeliveryServiceTest.java"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("deliveryService = new DeliveryService(deliveryRepository, orderRepository, org.mockito.Mockito.mock(com.quickbite.restaurant.RestaurantService.class), messagingTemplate);", "deliveryService = new DeliveryService(deliveryRepository, orderRepository, org.mockito.Mockito.mock(com.quickbite.restaurant.RestaurantService.class), messagingTemplate, historyRepository);")

with open(file_path, "w") as f:
    f.write(content)
