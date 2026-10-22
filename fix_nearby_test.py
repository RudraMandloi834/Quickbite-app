import re

with open('src/test/java/com/quickbite/restaurant/RestaurantNearbyTest.java', 'r') as f:
    content = f.read()

content = content.replace('.andExpect(jsonPath("$").isArray())', '.andExpect(jsonPath("$.content").isArray())')

with open('src/test/java/com/quickbite/restaurant/RestaurantNearbyTest.java', 'w') as f:
    f.write(content)

