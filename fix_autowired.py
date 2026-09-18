import re
import os

files = [
    "src/main/java/com/quickbite/delivery/DeliveryService.java",
    "src/main/java/com/quickbite/order/OrderService.java",
    "src/main/java/com/quickbite/order/RestaurantOrderService.java",
    "src/main/java/com/quickbite/payment/PaymentService.java"
]

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()
    
    # Replace the invalid syntax with proper annotations
    content = re.sub(
        r'private final org\.springframework\.context\.annotation\.Lazy @org\.springframework\.beans\.factory\.annotation\.Autowired (.*?) (.*?);',
        r'@org.springframework.context.annotation.Lazy\n    @org.springframework.beans.factory.annotation.Autowired\n    private \1 \2;',
        content
    )
    
    # We might have left it out of the constructor parameter list, but wait, we DID leave it out of the constructor parameter list when we did the replacement earlier! Because we only replaced the field definition.
    # Oh wait, we replaced `private final OrderEventPublisher ...` which WAS in the constructor. Let's see if we broke the constructor.
    # Actually, in `patch_order_service.py` we replaced:
    # `private final OrderEventPublisher orderEventPublisher;`
    # with
    # `private final OrderEventPublisher orderEventPublisher;\n    private final org.springframework...`
    # We DID NOT add it to the constructor. This is perfect for field injection! 
    
    with open(file_path, "w") as f:
        f.write(content)
