import re

with open('src/test/java/com/quickbite/OperatorRestaurantIntegrationTest.java', 'r') as f:
    content = f.read()

content = content.replace('jsonPath("$[0].id")', 'jsonPath("$.content[0].id")')

with open('src/test/java/com/quickbite/OperatorRestaurantIntegrationTest.java', 'w') as f:
    f.write(content)
