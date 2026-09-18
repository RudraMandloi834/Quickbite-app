import re

file_path = "src/main/java/com/quickbite/order/OrderService.java"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("order = lifecycleService.transitionOrder(order.getId()", "Order finalOrder = lifecycleService.transitionOrder(order.getId()")
content = content.replace("createOrderItem(order.getId(), cartItem)", "createOrderItem(finalOrder.getId(), cartItem)")
content = content.replace("order.setItems(orderItems);", "finalOrder.setItems(orderItems);")
content = content.replace("orderEventPublisher.publishOrderCreated(order);", "orderEventPublisher.publishOrderCreated(finalOrder);")
content = content.replace("return order;", "return finalOrder;")

with open(file_path, "w") as f:
    f.write(content)
