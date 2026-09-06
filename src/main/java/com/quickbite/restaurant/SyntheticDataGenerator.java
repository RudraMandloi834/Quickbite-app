package com.quickbite.restaurant;

import com.quickbite.menu.MenuItem;
import com.quickbite.menu.MenuItemRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
public class SyntheticDataGenerator {

    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;

    public SyntheticDataGenerator(RestaurantRepository restaurantRepository, MenuItemRepository menuItemRepository) {
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
    }

    private static final int TOTAL_RESTAURANTS = 10000;

    private static final String[] ADJECTIVES = {"Spicy", "Golden", "Royal", "The Grand", "Crispy", "Happy", "Sizzling", "Magic", "Secret", "Urban", "Vintage", "Modern", "Classic", "Rustic", "Emerald"};
    private static final String[] NOUNS = {"Spoon", "Bite", "Dragon", "Oven", "Tandoor", "Cafe", "Kitchen", "Diner", "Palace", "Bowl", "Platter", "Grill", "Bistro", "House", "Villa"};
    private static final String[] CUISINES = {"North Indian", "South Indian", "Chinese", "Italian", "Mughlai", "Biryani", "Continental", "Street Food", "Desserts", "Bakery", "Fast Food", "Mexican"};
    private static final String[] HOURS = {"10:00 AM - 10:00 PM", "11:00 AM - 11:00 PM", "09:00 AM - 11:00 PM", "12:00 PM - 12:00 AM", "24 Hours", "08:00 AM - 10:00 PM"};
    
    private static final String[] MENU_ITEMS = {"Paneer Tikka", "Chicken Biryani", "Margherita Pizza", "Pasta Alfredo", "Masala Dosa", "Hakka Noodles", "Tandoori Chicken", "Garlic Bread", "Caesar Salad", "Chocolate Brownie", "Spring Rolls", "Dal Makhani", "Butter Chicken", "Veg Burger", "French Fries"};

    private static class CityInfo {
        String name;
        double lat;
        double lng;
        String[] areas;
        
        CityInfo(String name, double lat, double lng, String[] areas) {
            this.name = name;
            this.lat = lat;
            this.lng = lng;
            this.areas = areas;
        }
    }

    private static final CityInfo[] CITIES = {
        new CityInfo("Bengaluru", 12.9716, 77.5946, new String[]{"Koramangala", "Indiranagar", "Whitefield", "Jayanagar", "HSR Layout", "Malleshwaram", "BTM Layout"}),
        new CityInfo("Mumbai", 19.0760, 72.8777, new String[]{"Bandra", "Andheri", "Juhu", "Colaba", "Powai", "Worli", "Lower Parel"}),
        new CityInfo("Delhi", 28.7041, 77.1025, new String[]{"Connaught Place", "Hauz Khas", "Rajouri Garden", "Vasant Kunj", "Karol Bagh", "Dwarka", "Rohini"}),
        new CityInfo("Hyderabad", 17.3850, 78.4867, new String[]{"Banjara Hills", "Jubilee Hills", "Hitec City", "Gachibowli", "Madhapur", "Kukatpally"}),
        new CityInfo("Chennai", 13.0827, 80.2707, new String[]{"T Nagar", "Velachery", "Adyar", "Anna Nagar", "Nungambakkam", "Mylapore"}),
        new CityInfo("Pune", 18.5204, 73.8567, new String[]{"Koregaon Park", "Viman Nagar", "Kothrud", "Baner", "Hinjewadi", "Kalyani Nagar"}),
        new CityInfo("Kolkata", 22.5726, 88.3639, new String[]{"Park Street", "Salt Lake", "Ballygunge", "New Town", "Alipore", "South City"}),
        new CityInfo("Ahmedabad", 23.0225, 72.5714, new String[]{"Navrangpura", "Vastrapur", "Bodakdev", "Prahlad Nagar", "SG Highway"}),
        new CityInfo("Jaipur", 26.9124, 75.7873, new String[]{"Malviya Nagar", "Vaishali Nagar", "C Scheme", "Raja Park", "Mansarovar"}),
        new CityInfo("Chandigarh", 30.7333, 76.7794, new String[]{"Sector 17", "Sector 35", "Sector 22", "Sector 26", "Elante"}),
        new CityInfo("Indore", 22.7196, 75.8577, new String[]{"Vijay Nagar", "Palasia", "Bhawarkua", "Rajwada", "Saket"})
    };

    public void generate() {
        if (restaurantRepository.count() > 5000) {
            return; // Idempotent check: if we already have thousands of restaurants, skip seeding
        }

        System.out.println("Starting synthetic dataset generation for " + TOTAL_RESTAURANTS + " restaurants...");
        
        List<Restaurant> restaurantBatch = new ArrayList<>();
        Random random = new Random(42);

        for (int i = 0; i < TOTAL_RESTAURANTS; i++) {
            CityInfo city = CITIES[random.nextInt(CITIES.length)];
            String area = city.areas[random.nextInt(city.areas.length)];
            
            String name = ADJECTIVES[random.nextInt(ADJECTIVES.length)] + " " + NOUNS[random.nextInt(NOUNS.length)];
            String cuisine = CUISINES[random.nextInt(CUISINES.length)];
            
            double latOffset = (random.nextDouble() - 0.5) * 0.2;
            double lngOffset = (random.nextDouble() - 0.5) * 0.2;
            double lat = city.lat + latOffset;
            double lng = city.lng + lngOffset;
            
            double rating = 3.0 + (random.nextDouble() * 2.0);
            String openingHours = HOURS[random.nextInt(HOURS.length)];
            double deliveryRadius = 2.0 + (random.nextDouble() * 8.0);
            String address = random.nextInt(999) + 1 + ", Main Road, " + area;
            String coverImageUrl = ImageConstants.RESTAURANT_IMAGES[random.nextInt(ImageConstants.RESTAURANT_IMAGES.length)];
            
            Restaurant r = new Restaurant(
                name, cuisine, area, Math.round(rating * 10.0) / 10.0,
                address, city.name, area, lat, lng, openingHours, Math.round(deliveryRadius * 10.0) / 10.0,
                coverImageUrl
            );
            restaurantBatch.add(r);
            
            if (restaurantBatch.size() == 1000) {
                saveBatch(restaurantBatch, random);
                restaurantBatch = new ArrayList<>();
            }
        }
        
        if (!restaurantBatch.isEmpty()) {
            saveBatch(restaurantBatch, random);
        }
        
        System.out.println("Successfully seeded 10,000+ restaurants and menus.");
    }
    
    private void saveBatch(List<Restaurant> batch, Random random) {
        List<Restaurant> savedRestaurants = restaurantRepository.saveAll(batch);
        List<MenuItem> menus = new ArrayList<>();
        for (Restaurant r : savedRestaurants) {
            int numItems = 3 + random.nextInt(5); // 3 to 7 items
            for (int j = 0; j < numItems; j++) {
                String itemName = MENU_ITEMS[random.nextInt(MENU_ITEMS.length)] + " " + (j + 1);
                double priceVal = 100.0 + random.nextInt(400);
                String imageUrl = ImageConstants.MENU_IMAGES[random.nextInt(ImageConstants.MENU_IMAGES.length)];
                menus.add(new MenuItem(r.getId(), itemName, "Delicious " + itemName, BigDecimal.valueOf(priceVal), true, imageUrl));
            }
        }
        menuItemRepository.saveAll(menus);
    }
}
