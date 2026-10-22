import re

# Patch Restaurant.java
with open("src/main/java/com/quickbite/restaurant/Restaurant.java", "r") as f:
    r_content = f.read()

r_indexes = """@Table(
    name = "restaurant",
    indexes = {
        @Index(name = "idx_restaurant_lat_lng", columnList = "latitude, longitude"),
        @Index(name = "idx_restaurant_city", columnList = "city"),
        @Index(name = "idx_restaurant_status", columnList = "status"),
        @Index(name = "idx_restaurant_name", columnList = "name"),
        @Index(name = "idx_restaurant_cuisine", columnList = "cuisine")
    }
)"""
r_content = re.sub(r'@Table\([\s\S]*?indexes\s*=\s*\{[\s\S]*?\}[\s\S]*?\)', r_indexes, r_content)
with open("src/main/java/com/quickbite/restaurant/Restaurant.java", "w") as f:
    f.write(r_content)


# Patch Order.java
with open("src/main/java/com/quickbite/order/Order.java", "r") as f:
    o_content = f.read()

if "import jakarta.persistence.Index;" not in o_content:
    o_content = o_content.replace("import jakarta.persistence.Table;", "import jakarta.persistence.Table;\nimport jakarta.persistence.Index;")

o_indexes = """@Table(
    name = "orders",
    indexes = {
        @Index(name = "idx_order_customer_id", columnList = "customerId"),
        @Index(name = "idx_order_restaurant_id", columnList = "restaurantId"),
        @Index(name = "idx_order_status", columnList = "status")
    }
)"""
o_content = o_content.replace('@Table(name = "orders")', o_indexes)
with open("src/main/java/com/quickbite/order/Order.java", "w") as f:
    f.write(o_content)


# Patch Delivery.java
with open("src/main/java/com/quickbite/delivery/Delivery.java", "r") as f:
    d_content = f.read()

if "import jakarta.persistence.Index;" not in d_content:
    d_content = d_content.replace("import jakarta.persistence.Table;", "import jakarta.persistence.Table;\nimport jakarta.persistence.Index;")
    if "import jakarta.persistence.Table;" not in d_content:
        d_content = d_content.replace("import jakarta.persistence.Id;", "import jakarta.persistence.Id;\nimport jakarta.persistence.Table;\nimport jakarta.persistence.Index;")

d_indexes = """@Entity
@Table(
    name = "delivery",
    indexes = {
        @Index(name = "idx_delivery_driver_id", columnList = "driverId"),
        @Index(name = "idx_delivery_status", columnList = "status")
    }
)"""
d_content = d_content.replace('@Entity', d_indexes)
with open("src/main/java/com/quickbite/delivery/Delivery.java", "w") as f:
    f.write(d_content)

