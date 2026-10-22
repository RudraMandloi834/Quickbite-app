import re

with open('src/test/java/com/quickbite/delivery/DeliveryServiceTest.java', 'r') as f:
    content = f.read()

# Instead of passing it via constructor (which doesn't exist), we use reflection or we can just replace new DeliveryService with @InjectMocks.
# Actually, since it's field injected, we can do reflection.
reflection_code = """deliveryService = new DeliveryService(deliveryRepository, orderRepository, sseService, historyRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(deliveryService, "orderLifecycleService", orderLifecycleService);"""
content = content.replace('deliveryService = new DeliveryService(deliveryRepository, orderRepository, sseService, historyRepository, orderLifecycleService);', reflection_code)

with open('src/test/java/com/quickbite/delivery/DeliveryServiceTest.java', 'w') as f:
    f.write(content)

with open('src/test/java/com/quickbite/payment/PaymentServiceTest.java', 'r') as f:
    content = f.read()

reflection_code_payment = """paymentService = new PaymentService(paymentRepository, orderRepository, razorpayClient);
        org.springframework.test.util.ReflectionTestUtils.setField(paymentService, "lifecycleService", lifecycleService);"""
content = content.replace('paymentService = new PaymentService(paymentRepository, orderRepository, razorpayClient, lifecycleService);', reflection_code_payment)

with open('src/test/java/com/quickbite/payment/PaymentServiceTest.java', 'w') as f:
    f.write(content)

