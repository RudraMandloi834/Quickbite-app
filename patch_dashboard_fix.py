import re

file_path = "frontend/src/app/restaurant/dashboard/page.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace('{o.status === "RESTAURANT_ACCEPTED" || o.status === "PAYMENT_PENDING" && (', '{o.status === "CONFIRMED" && (')
content = content.replace('{o.status === "CONFIRMED" && (\n                      <button onClick={() => handleUpdateOrderStatus(o.id, "CANCELLED")}', '{(o.status === "CONFIRMED" || o.status === "RESTAURANT_ACCEPTED" || o.status === "PREPARING") && (\n                      <button onClick={() => handleUpdateOrderStatus(o.id, "CANCELLED")}')

with open(file_path, "w") as f:
    f.write(content)
