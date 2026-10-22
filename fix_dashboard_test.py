import re

with open('src/test/java/com/quickbite/RestaurantDashboardIntegrationTest.java', 'r') as f:
    content = f.read()

content = content.replace('content("{\\"status\\":\\"CONFIRMED\\"}")).andExpect(status().isNotFound());',
    'content("{\\"status\\":\\"RESTAURANT_ACCEPTED\\"}")).andExpect(status().isNotFound());')
content = content.replace('content("{\\"status\\":\\"CONFIRMED\\"}")).andExpect(status().isOk());',
    'content("{\\"status\\":\\"RESTAURANT_ACCEPTED\\"}")).andExpect(status().isOk());')

# t18: "Since CANCELLED -> anything is forbidden if not pending"
# But wait, RESTAURANT_ACCEPTED -> CANCELLED is allowed in validateTransition?
# Let's change the start state to PREPARING, and target state to RESTAURANT_ACCEPTED.
# That is definitely backward and invalid.
content = content.replace('order.setStatus(OrderStatus.CONFIRMED);', 'order.setStatus(OrderStatus.PREPARING);')
content = content.replace('content("{\\"status\\":\\"CANCELLED\\"}")).andExpect(status().isConflict());',
    'content("{\\"status\\":\\"RESTAURANT_ACCEPTED\\"}")).andExpect(status().isBadRequest());')

with open('src/test/java/com/quickbite/RestaurantDashboardIntegrationTest.java', 'w') as f:
    f.write(content)

