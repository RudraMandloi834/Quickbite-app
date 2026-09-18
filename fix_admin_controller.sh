#!/bin/bash
sed -i 's/public List<?> getAllDeliveries() {/public List<?> getAllDeliveries() {\n        return deliveryRepository.findAll();\n    }\n\n    @GetMapping("\/restaurants")\n    public List<?> getAllRestaurants() {\n        return restaurantRepository.findAll();\n    }/g' src/main/java/com/quickbite/admin/AdminController.java
