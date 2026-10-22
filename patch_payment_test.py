import re

with open('src/test/java/com/quickbite/payment/PaymentServiceTest.java', 'r') as f:
    content = f.read()

content = content.replace('private OrderRepository orderRepository;',
    'private OrderRepository orderRepository;\n\n    @org.mockito.Mock\n    private com.quickbite.order.OrderLifecycleService lifecycleService;')

content = content.replace('paymentService = new PaymentService(paymentRepository, orderRepository, razorpayClient);',
    'paymentService = new PaymentService(paymentRepository, orderRepository, razorpayClient, lifecycleService);')

content = content.replace('mockOrder.setStatus(OrderStatus.DELIVERED);', 'mockOrder.setStatus(OrderStatus.PENDING);')
content = content.replace('mockOrder.setStatus(OrderStatus.CONFIRMED);', 'mockOrder.setStatus(OrderStatus.PENDING);')

with open('src/test/java/com/quickbite/payment/PaymentServiceTest.java', 'w') as f:
    f.write(content)
