import re

with open('src/test/java/com/quickbite/payment/PaymentServiceTest.java', 'r') as f:
    content = f.read()

content = content.replace('Order order = new Order(1L, 1L, BigDecimal.valueOf(250));\n        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));',
    'Order order = new Order(1L, 1L, BigDecimal.valueOf(250));\n        order.setStatus(OrderStatus.PAYMENT_PENDING);\n        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));')

content = content.replace('mockOrder.setStatus(OrderStatus.PENDING);', 'mockOrder.setStatus(OrderStatus.PAYMENT_PENDING);')

with open('src/test/java/com/quickbite/payment/PaymentServiceTest.java', 'w') as f:
    f.write(content)

