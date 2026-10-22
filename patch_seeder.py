import re

with open('src/main/java/com/quickbite/DevDataSeeder.java', 'r') as f:
    content = f.read()

# Replace the block that seeds 10,000 restaurants
old_seed_block = r"""if \(restaurantRepository\.count\(\) < 10000\) \{.*?Finished seeding 10,000 restaurants\."\);\s*\}"""

new_seed_block = """
            long count = restaurantRepository.count();
            if (count < 10000) {
                System.out.println("Seeding Indian restaurants...");
                List<Restaurant> generated = com.quickbite.IndianRestaurantData.generate(10000 - (int)count);
                List<Restaurant> bulk = new java.util.ArrayList<>();
                for (Restaurant r : generated) {
                    bulk.add(r);
                    if (bulk.size() >= 1000) {
                        restaurantRepository.saveAll(bulk);
                        bulk.clear();
                    }
                }
                if (!bulk.isEmpty()) restaurantRepository.saveAll(bulk);
                System.out.println("Finished seeding Indian restaurants.");
            }
"""

content = re.sub(old_seed_block, new_seed_block, content, flags=re.DOTALL)

with open('src/main/java/com/quickbite/DevDataSeeder.java', 'w') as f:
    f.write(content)

