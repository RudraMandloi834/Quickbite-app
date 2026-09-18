import re

file_path = "src/main/java/com/quickbite/order/Order.java"
with open(file_path, "r") as f:
    content = f.read()

# Remove setStatus method entirely? No, let's keep it but ideally only OrderLifecycleService calls it.
# Actually OrderLifecycleService uses `order.setStatus()`.
content = content.replace("this.status = OrderStatus.PENDING;", "this.status = OrderStatus.CREATED;")

with open(file_path, "w") as f:
    f.write(content)
