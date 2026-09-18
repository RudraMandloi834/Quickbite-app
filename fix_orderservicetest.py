import re

file_path = "src/test/java/com/quickbite/order/OrderServiceTest.java"
with open(file_path, "r") as f:
    content = f.read()

# Remove the cancelOrder tests since we removed cancelOrder method
content = re.sub(r'@Test\s+void cancelsExistingPendingOrder\(\) \{.*?\n    \}', '', content, flags=re.DOTALL)
content = re.sub(r'@Test\s+void returnsNotFoundForMissingOrder\(\) \{.*?\n    \}', '', content, flags=re.DOTALL)
content = re.sub(r'@Test\s+void returnsConflictForConfirmedOrCancelledOrder\(\) \{.*?\n    \}', '', content, flags=re.DOTALL)

with open(file_path, "w") as f:
    f.write(content)
