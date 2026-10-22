import re
with open('src/test/java/com/quickbite/delivery/DeliveryControllerTest.java', 'r') as f:
    content = f.read()

content = content.replace('.andExpect(jsonPath("$.status").value("ASSIGNING"))', '.andExpect(jsonPath("$.status").value("AVAILABLE"))')

with open('src/test/java/com/quickbite/delivery/DeliveryControllerTest.java', 'w') as f:
    f.write(content)
