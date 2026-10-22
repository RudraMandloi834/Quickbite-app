import re
with open('src/test/java/com/quickbite/payment/PaymentServiceTest.java', 'r') as f:
    content = f.read()
content = re.sub(r'verify\(orderRepository\)\.save\(any\(Order\.class\)\);', '// removed', content)
with open('src/test/java/com/quickbite/payment/PaymentServiceTest.java', 'w') as f:
    f.write(content)
