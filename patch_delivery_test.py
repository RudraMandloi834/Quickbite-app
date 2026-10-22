import re

with open('src/test/java/com/quickbite/delivery/DeliveryServiceTest.java', 'r') as f:
    content = f.read()

content = content.replace('private DeliveryStatusHistoryRepository historyRepository;',
    'private DeliveryStatusHistoryRepository historyRepository;\n\n    @org.mockito.Mock\n    private com.quickbite.order.OrderLifecycleService orderLifecycleService;')

content = content.replace('deliveryService = new DeliveryService(deliveryRepository, orderRepository, sseService, historyRepository);',
    'deliveryService = new DeliveryService(deliveryRepository, orderRepository, sseService, historyRepository, orderLifecycleService);')

with open('src/test/java/com/quickbite/delivery/DeliveryServiceTest.java', 'w') as f:
    f.write(content)

