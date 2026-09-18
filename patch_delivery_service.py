import re

file_path = "src/main/java/com/quickbite/delivery/DeliveryService.java"
with open(file_path, "r") as f:
    content = f.read()

# isDriverAssignedToOrder method
method = """
    public boolean isDriverAssignedToOrder(Long orderId, Long driverId) {
        return deliveryRepository.findByOrderId(orderId)
                .map(d -> driverId.equals(d.getDriverId()))
                .orElse(false);
    }
"""
content = content.replace("public Delivery getDelivery(Long deliveryId) {", method + "\n    public Delivery getDelivery(Long deliveryId) {")

# Delivery creation checks
content = content.replace("OrderStatus.PENDING", "OrderStatus.CREATED")
content = content.replace("if (order.getStatus() != OrderStatus.CONFIRMED)", "if (order.getStatus() == OrderStatus.CREATED || order.getStatus() == OrderStatus.PAYMENT_PENDING)")
# Actually, the logic was:
# if (order.getStatus() == OrderStatus.PENDING) { ... }
# if (order.getStatus() == OrderStatus.CANCELLED) { ... }
# if (order.getStatus() != OrderStatus.CONFIRMED) { ... }
# We want to allow delivery creation if it is CONFIRMED or later!
# Let's replace the whole verify block.

create_old = """if (order.getStatus() == OrderStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Pending orders cannot have a delivery");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cancelled orders cannot have a delivery");
        }
        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only confirmed orders can have a delivery");
        }"""
create_new = """if (order.getStatus() == OrderStatus.CREATED || order.getStatus() == OrderStatus.PAYMENT_PENDING || order.getStatus() == OrderStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Unconfirmed orders cannot have a delivery");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cancelled orders cannot have a delivery");
        }"""
content = content.replace(create_old, create_new)

with open(file_path, "w") as f:
    f.write(content)
