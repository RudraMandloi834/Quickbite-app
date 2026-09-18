import re

file_path = "frontend/src/app/restaurant/dashboard/page.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace('handleUpdateOrderStatus(o.id, "CONFIRMED")', 'handleUpdateOrderStatus(o.id, "RESTAURANT_ACCEPTED")')
content = content.replace('handleUpdateOrderStatus(o.id, "READY")', 'handleUpdateOrderStatus(o.id, "READY_FOR_PICKUP")')
content = content.replace('>Confirm<', '>Accept<')

# The dashboard summary probably maps statuses, let's fix that if needed.
# Let's also check if it expects certain strings in UI.
content = content.replace('o.status === "PENDING"', 'o.status === "CONFIRMED" || o.status === "PAYMENT_PENDING"')
content = content.replace('o.status === "CONFIRMED"', 'o.status === "RESTAURANT_ACCEPTED"')

with open(file_path, "w") as f:
    f.write(content)
