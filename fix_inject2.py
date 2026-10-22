import re

with open('src/test/java/com/quickbite/delivery/DeliveryServiceTest.java', 'r') as f:
    content = f.read()

content = content.replace('deliveryService = new DeliveryService(deliveryRepository, orderRepository, org.mockito.Mockito.mock(com.quickbite.restaurant.RestaurantService.class), sseService, historyRepository);',
    'deliveryService = new DeliveryService(deliveryRepository, orderRepository, org.mockito.Mockito.mock(com.quickbite.restaurant.RestaurantService.class), sseService, historyRepository);\n        org.springframework.test.util.ReflectionTestUtils.setField(deliveryService, "orderLifecycleService", orderLifecycleService);')

with open('src/test/java/com/quickbite/delivery/DeliveryServiceTest.java', 'w') as f:
    f.write(content)

with open('src/test/java/com/quickbite/payment/PaymentServiceTest.java', 'r') as f:
    content = f.read()

content = content.replace('paymentService = new PaymentService(paymentRepository, orderRepository, razorpayClient);',
    'paymentService = new PaymentService(paymentRepository, orderRepository, razorpayClient);\n        org.springframework.test.util.ReflectionTestUtils.setField(paymentService, "lifecycleService", lifecycleService);')

with open('src/test/java/com/quickbite/payment/PaymentServiceTest.java', 'w') as f:
    f.write(content)
