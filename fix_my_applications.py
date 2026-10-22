import re

with open('src/test/java/com/quickbite/restaurant/RestaurantOnboardingTest.java', 'r') as f:
    content = f.read()

# I patched both previously without checking. Let's fix testUserCanOnlySeeOwnApplications manually.
# In testUserCanOnlySeeOwnApplications, it uses list and list2.
content = content.replace(
    'com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(res);\n        List<Restaurant> list = objectMapper.convertValue(root.get("content"), new TypeReference<List<Restaurant>>() {});',
    'List<Restaurant> list = objectMapper.readValue(res, new TypeReference<List<Restaurant>>() {});',
    1 # Only the first occurrence which is in testUserCanOnlySeeOwnApplications
)

content = content.replace(
    'com.fasterxml.jackson.databind.JsonNode root2 = objectMapper.readTree(res2);\n        List<Restaurant> list2 = objectMapper.convertValue(root2.get("content"), new TypeReference<List<Restaurant>>() {});',
    'List<Restaurant> list2 = objectMapper.readValue(res2, new TypeReference<List<Restaurant>>() {});',
    1
)

with open('src/test/java/com/quickbite/restaurant/RestaurantOnboardingTest.java', 'w') as f:
    f.write(content)

