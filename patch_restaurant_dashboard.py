import re

file_path = "src/main/java/com/quickbite/restaurant/RestaurantDashboardController.java"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("OrderStatus.PENDING", "OrderStatus.PAYMENT_PENDING")
content = content.replace("OrderStatus.READY", "OrderStatus.READY_FOR_PICKUP")

with open(file_path, "w") as f:
    f.write(content)
