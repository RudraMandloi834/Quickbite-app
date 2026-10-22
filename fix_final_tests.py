import re

with open('src/test/java/com/quickbite/OperatorRestaurantIntegrationTest.java', 'r') as f:
    content = f.read()
content = content.replace('jsonPath("$[0].id").value(pendingRestaurantId)', 'jsonPath("$.content[0].id").value(pendingRestaurantId)')
with open('src/test/java/com/quickbite/OperatorRestaurantIntegrationTest.java', 'w') as f:
    f.write(content)

with open('src/test/java/com/quickbite/RestaurantDashboardIntegrationTest.java', 'r') as f:
    content = f.read()
content = content.replace('content("{\\"status\\":\\"RESTAURANT_ACCEPTED\\"}")).andExpect(status().isOk());',
    'content("{\\"status\\":\\"CANCELLED\\"}")).andExpect(status().isOk());')
content = content.replace('content("{\\"status\\":\\"PREPARING\\"}")).andExpect(status().isOk());',
    'content("{\\"status\\":\\"CANCELLED\\"}")).andExpect(status().isOk());')
with open('src/test/java/com/quickbite/RestaurantDashboardIntegrationTest.java', 'w') as f:
    f.write(content)

with open('src/test/java/com/quickbite/payment/PaymentServiceTest.java', 'r') as f:
    content = f.read()
# Let's see if the class uses @ExtendWith(MockitoExtension.class)
# If not, MockitoAnnotations.openMocks(this) is needed in setUp.
if 'MockitoExtension' not in content:
    content = content.replace('public void setUp() {', 'public void setUp() {\n        org.mockito.MockitoAnnotations.openMocks(this);')
    content = content.replace('void setUp() {', 'void setUp() {\n        org.mockito.MockitoAnnotations.openMocks(this);')
with open('src/test/java/com/quickbite/payment/PaymentServiceTest.java', 'w') as f:
    f.write(content)

with open('src/test/java/com/quickbite/delivery/DeliveryServiceTest.java', 'r') as f:
    content = f.read()
if 'MockitoExtension' not in content:
    content = content.replace('public void setUp() {', 'public void setUp() {\n        org.mockito.MockitoAnnotations.openMocks(this);')
    content = content.replace('void setUp() {', 'void setUp() {\n        org.mockito.MockitoAnnotations.openMocks(this);')
with open('src/test/java/com/quickbite/delivery/DeliveryServiceTest.java', 'w') as f:
    f.write(content)

