#!/bin/bash
sed -i '/Development data seeding complete/i \
System.out.println("PENDING APPS: " + restaurantRepository.findByStatus(RestaurantStatus.PENDING_APPROVAL).size()); \
System.out.println("ALL APPS: " + restaurantRepository.findAll().size()); \
for(Restaurant r: restaurantRepository.findAll()) { System.out.println(r.getName() + " - " + r.getStatus()); } \
' src/main/java/com/quickbite/DevDataSeeder.java
