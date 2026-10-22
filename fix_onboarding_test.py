import re

with open('src/test/java/com/quickbite/restaurant/RestaurantOnboardingTest.java', 'r') as f:
    content = f.read()

content = content.replace(
    'String res = mockMvc.perform(get("/api/restaurants").param("size", "20000").param("search", "Rest"))',
    'String res = mockMvc.perform(get("/api/restaurants").param("city", "L"))'
)

with open('src/test/java/com/quickbite/restaurant/RestaurantOnboardingTest.java', 'w') as f:
    f.write(content)
