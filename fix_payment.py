import re

with open('src/test/java/com/quickbite/payment/PaymentServiceTest.java', 'r') as f:
    content = f.read()

content = content.replace('paymentService = new PaymentService(paymentRepository, orderRepository, razorpayClient, deliveryService, environment);',
    'paymentService = new PaymentService(paymentRepository, orderRepository, razorpayClient, deliveryService, environment);\n        org.springframework.test.util.ReflectionTestUtils.setField(paymentService, "lifecycleService", lifecycleService);')

with open('src/test/java/com/quickbite/payment/PaymentServiceTest.java', 'w') as f:
    f.write(content)

