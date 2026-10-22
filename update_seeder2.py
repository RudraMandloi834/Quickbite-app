import re
with open("src/main/java/com/quickbite/DevDataSeeder.java", "r") as f: content = f.read()

seeding_logic = """
            if (restaurantRepository.count() < 10000) {
                System.out.println("Seeding 10,000 restaurants for scale testing...");
                List<Restaurant> bulk = new java.util.ArrayList<>();
                String[] cuisines = {"Italian", "Mexican", "Chinese", "Indian", "American", "Thai", "Japanese"};
                String[] cities = {"New York", "San Francisco", "Austin", "Chicago", "Seattle"};
                String[] names = {"Bistro", "Cafe", "Grill", "Diner", "Kitchen", "Tavern", "House", "Place"};
                String[] adjectives = {"Golden", "Silver", "Red", "Blue", "Green", "Spicy", "Sweet", "Savory"};
                
                java.util.Random rnd = new java.util.Random();
                
                for (int i = 0; i < 10000; i++) {
                    Restaurant r = new Restaurant(
                            adjectives[rnd.nextInt(adjectives.length)] + " " + names[rnd.nextInt(names.length)] + " " + i,
                            cuisines[rnd.nextInt(cuisines.length)],
                            "123 Test St",
                            4.0 + (rnd.nextDouble()),
                            "123 Test St",
                            cities[rnd.nextInt(cities.length)],
                            "Downtown",
                            37.7749 + (rnd.nextDouble() - 0.5) * 0.1,
                            -122.4194 + (rnd.nextDouble() - 0.5) * 0.1,
                            "09:00 - 22:00",
                            5.0,
                            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80"
                    );
                    r.setStatus(RestaurantStatus.APPROVED);
                    bulk.add(r);
                    if (bulk.size() >= 1000) {
                        restaurantRepository.saveAll(bulk);
                        bulk.clear();
                    }
                }
                if (!bulk.isEmpty()) restaurantRepository.saveAll(bulk);
                System.out.println("Finished seeding 10,000 restaurants.");
            }
"""

content = content.replace('System.out.println("Starting development data seeder...");', 'System.out.println("Starting development data seeder...");\n' + seeding_logic)
with open("src/main/java/com/quickbite/DevDataSeeder.java", "w") as f: f.write(content)
