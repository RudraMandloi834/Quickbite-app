import re

with open('src/main/java/com/quickbite/event/SseService.java', 'r') as f:
    content = f.read()

content = content.replace('List<SseEmitter> list = customerEmitters.get(customerId);',
    'if (customerId == null) return;\n        List<SseEmitter> list = customerEmitters.get(customerId);')
content = content.replace('List<SseEmitter> list = restaurantEmitters.get(restaurantOwnerId);',
    'if (restaurantOwnerId == null) return;\n        List<SseEmitter> list = restaurantEmitters.get(restaurantOwnerId);')
content = content.replace('List<SseEmitter> list = driverEmitters.get(driverId);',
    'if (driverId == null) return;\n        List<SseEmitter> list = driverEmitters.get(driverId);')

with open('src/main/java/com/quickbite/event/SseService.java', 'w') as f:
    f.write(content)

