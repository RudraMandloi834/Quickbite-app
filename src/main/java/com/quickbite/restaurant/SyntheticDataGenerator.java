package com.quickbite.restaurant;

import com.quickbite.menu.MenuItem;
import com.quickbite.menu.MenuItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

@Component
public class SyntheticDataGenerator {

    private static final Logger logger = LoggerFactory.getLogger(SyntheticDataGenerator.class);

    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private TransactionTemplate transactionTemplate;

    @Value("${quickbite.seed.target-restaurants:10000}")
    private int targetRestaurants = 10000;

    @Value("${quickbite.seed.batch-size:1000}")
    private int batchSize = 1000;

    @Value("${quickbite.seed.async:true}")
    private boolean async = true;

    @Value("${quickbite.seed.enabled:true}")
    private boolean enabled = true;

    public SyntheticDataGenerator(RestaurantRepository restaurantRepository, MenuItemRepository menuItemRepository) {
        this(restaurantRepository, menuItemRepository, null);
    }

    @Autowired
    public SyntheticDataGenerator(
            RestaurantRepository restaurantRepository,
            MenuItemRepository menuItemRepository,
            @Autowired(required = false) TransactionTemplate transactionTemplate) {
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
        this.transactionTemplate = transactionTemplate;
    }

    public void setTransactionTemplate(TransactionTemplate transactionTemplate) {
        this.transactionTemplate = transactionTemplate;
    }

    public void setTargetRestaurants(int targetRestaurants) {
        this.targetRestaurants = targetRestaurants;
    }

    public int getTargetRestaurants() {
        return targetRestaurants;
    }

    public void setBatchSize(int batchSize) {
        this.batchSize = batchSize;
    }

    public int getBatchSize() {
        return batchSize;
    }

    public void setAsync(boolean async) {
        this.async = async;
    }

    public boolean isAsync() {
        return async;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean isEnabled() {
        return enabled;
    }

    private static final String[] PREFIXES = {"Shree", "New", "Royal", "The Great", "Authentic", "Golden", "Grand", "Bombay", "Delhi", "Famous", "Original", "Pind", "Maha", "Desi", "Swad"};
    private static final String[] NOUNS = {"Spoon", "Bite", "Kitchen", "Diner", "Palace", "Bowl", "Platter", "Grill", "Bistro", "House", "Villa", "Rasoi", "Darbar", "Tandoor", "Zayka", "Bhavan", "Sweets", "Dhaba", "Eatery", "Spice"};
    private static final String[] CUISINES = {"North Indian", "South Indian", "Chinese", "Italian", "Mughlai", "Biryani", "Continental", "Street Food", "Desserts", "Bakery", "Fast Food", "Healthy Food", "Gujarati", "Punjabi", "Seafood"};
    private static final String[] HOURS = {"10:00 AM - 10:00 PM", "11:00 AM - 11:00 PM", "09:00 AM - 11:00 PM", "12:00 PM - 12:00 AM", "24 Hours", "08:00 AM - 10:00 PM"};
    
    private static final String[] MENU_ITEMS = {"Paneer Tikka", "Chicken Biryani", "Margherita Pizza", "Pasta Alfredo", "Masala Dosa", "Hakka Noodles", "Tandoori Chicken", "Garlic Bread", "Caesar Salad", "Chocolate Brownie", "Spring Rolls", "Dal Makhani", "Butter Chicken", "Veg Burger", "French Fries", "Mutton Rogan Josh", "Chhole Bhature", "Idli Sambar", "Fish Curry", "Gulab Jamun"};

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
        new CityInfo("Delhi", 28.7041, 77.1025, new String[]{"Connaught Place", "Hauz Khas", "Rajouri Garden", "Vasant Kunj", "Karol Bagh", "Dwarka", "Rohini", "Chandni Chowk", "Lajpat Nagar", "Saket"}),
        new CityInfo("Mumbai", 19.0760, 72.8777, new String[]{"Bandra", "Andheri", "Juhu", "Colaba", "Powai", "Worli", "Lower Parel", "Borivali", "Goregaon", "Malad"}),
        new CityInfo("Bengaluru", 12.9716, 77.5946, new String[]{"Koramangala", "Indiranagar", "Whitefield", "Jayanagar", "HSR Layout", "Malleshwaram", "BTM Layout", "Marathahalli", "Yelahanka", "Electronic City"}),
        new CityInfo("Hyderabad", 17.3850, 78.4867, new String[]{"Banjara Hills", "Jubilee Hills", "Hitec City", "Gachibowli", "Madhapur", "Kukatpally", "Begumpet", "Ameerpet", "Secunderabad", "Kondapur"}),
        new CityInfo("Chennai", 13.0827, 80.2707, new String[]{"T Nagar", "Velachery", "Adyar", "Anna Nagar", "Nungambakkam", "Mylapore", "Besant Nagar", "OMR", "Guindy", "Alwarpet"}),
        new CityInfo("Kolkata", 22.5726, 88.3639, new String[]{"Park Street", "Salt Lake", "Ballygunge", "New Town", "Alipore", "South City", "Gariahat", "Dum Dum", "Behala", "Jadavpur"}),
        new CityInfo("Pune", 18.5204, 73.8567, new String[]{"Koregaon Park", "Viman Nagar", "Kothrud", "Baner", "Hinjewadi", "Kalyani Nagar", "Aundh", "Wakad", "Camp", "Magarpatta"}),
        new CityInfo("Ahmedabad", 23.0225, 72.5714, new String[]{"Navrangpura", "Vastrapur", "Bodakdev", "Prahlad Nagar", "SG Highway", "Bopal", "Satellite", "Maninagar", "Paldi", "Chandkheda"}),
        new CityInfo("Jaipur", 26.9124, 75.7873, new String[]{"Malviya Nagar", "Vaishali Nagar", "C Scheme", "Raja Park", "Mansarovar", "Bani Park", "Tonk Road", "Vidhyadhar Nagar", "Jagatpura", "Civil Lines"}),
        new CityInfo("Lucknow", 26.8467, 80.9462, new String[]{"Hazratganj", "Gomti Nagar", "Aliganj", "Indira Nagar", "Aminabad", "Chowk", "Kapoorthala", "Alambagh", "Mahanagar", "Jankipuram"}),
        new CityInfo("Indore", 22.7196, 75.8577, new String[]{"Vijay Nagar", "Palasia", "Bhawarkua", "Rajwada", "Saket", "Geeta Bhawan", "Annapurna", "Sudama Nagar", "Bypass Road", "Bhawrasla"}),
        new CityInfo("Bhopal", 23.2599, 77.4126, new String[]{"MP Nagar", "Arera Colony", "TT Nagar", "Bairagarh", "Kolar Road", "Govindpura", "Awadhpuri", "Habibganj", "Indrapuri", "Ashoka Garden"}),
        new CityInfo("Chandigarh", 30.7333, 76.7794, new String[]{"Sector 17", "Sector 35", "Sector 22", "Sector 26", "Elante", "Sector 43", "Sector 15", "Sector 8", "Sector 9", "Mani Majra"}),
        new CityInfo("Surat", 21.1702, 72.8311, new String[]{"Vesu", "Adajan", "Piplod", "Varachha", "City Light", "Athwa", "Udhna", "Palanpur", "Katargam", "Bhatar"}),
        new CityInfo("Nagpur", 21.1458, 79.0882, new String[]{"Dharampeth", "Sadar", "Sitabuldi", "Wardhaman Nagar", "Mahal", "Pratap Nagar", "Manish Nagar", "Hingna", "Nandanvan", "Ramdaspeth"}),
        new CityInfo("Patna", 25.5941, 85.1376, new String[]{"Frazer Road", "Boring Road", "Kankarbagh", "Rajendra Nagar", "Patliputra", "Danapur", "Anisabad", "Gandhi Maidan", "Dak Bungalow", "Phulwari Sharif"}),
        new CityInfo("Kochi", 9.9312, 76.2673, new String[]{"Fort Kochi", "Edappally", "Kaloor", "Panampilly Nagar", "MG Road", "Vyttila", "Kakkanad", "Palarivattom", "Marine Drive", "Thrippunithura"}),
        new CityInfo("Coimbatore", 11.0168, 76.9558, new String[]{"RS Puram", "Peelamedu", "Saibaba Colony", "Gandhipuram", "Vadavalli", "Saravanampatti", "Race Course", "Singanallur", "Ramanathapuram", "Kuniyamuthur"}),
        new CityInfo("Vadodara", 22.3072, 73.1812, new String[]{"Alkapuri", "Akota", "Fatehgunj", "Sama", "Sayajigunj", "Gotri", "Karelibaug", "Vasna", "Manjalpur", "Waghodia"}),
        new CityInfo("Visakhapatnam", 17.6868, 83.2185, new String[]{"MVP Colony", "Siripuram", "Gajuwaka", "Madhurawada", "Daba Gardens", "Asilmetta", "Seethammadhara", "NAD X Road", "Pendurthi", "Rushikonda"}),
        new CityInfo("Nashik", 20.0110, 73.7903, new String[]{"College Road", "Gangapur Road", "Panchavati", "Indira Nagar", "CIDCO", "Satpur", "Pathardi Phata", "Nashik Road", "Mahatma Nagar", "Deolali"}),
        new CityInfo("Mysuru", 12.2958, 76.6394, new String[]{"Gokulam", "Kuvempu Nagar", "Jayalakshmipuram", "Vidyaranyapuram", "Vijayanagar", "Saraswathipuram", "Hebbal", "Bannimantap", "Chamrajpura", "Bogadi"}),
        new CityInfo("Goa", 15.2993, 74.1240, new String[]{"Panaji", "Margao", "Vasco", "Mapusa", "Ponda", "Calangute", "Baga", "Candolim", "Anjuna", "Porvorim"}),
        new CityInfo("Bhubaneswar", 20.2961, 85.8245, new String[]{"Patia", "Jayadev Vihar", "Khandagiri", "Nayapalli", "Saheed Nagar", "Chandrasekharpur", "Bapuji Nagar", "Old Town", "Unit 4", "Rasulgarh"}),
        new CityInfo("Guwahati", 26.1445, 91.7362, new String[]{"GS Road", "Fancy Bazar", "Bhangagarh", "Christian Basti", "Uzan Bazar", "Silpukhuri", "Six Mile", "Beltola", "ZOO Road", "Ganeshguri"}),
        new CityInfo("Dehradun", 30.3165, 78.0322, new String[]{"Rajpur Road", "Paltan Bazaar", "Clement Town", "Dharampur", "Vasant Vihar", "Prem Nagar", "Garhi Cantt", "Ballupur", "Karanpur", "Jakhan"}),
        new CityInfo("Amritsar", 31.6340, 74.8723, new String[]{"Ranjit Avenue", "Lawrence Road", "Golden Temple Area", "Mall Road", "Putligarh", "Majitha Road", "Civil Lines", "Chheharta", "Albert Road", "Green Avenue"}),
        new CityInfo("Rajkot", 22.3039, 70.8022, new String[]{"Kalawad Road", "Amin Marg", "Yagnik Road", "University Road", "Nana Mava", "Sadhu Vaswani Road", "Astron Chowk", "Gondal Road", "Mavdi", "Race Course"}),
    };

    public void startSeeding() {
        if (!enabled) {
            logger.info("Database seeding is disabled (quickbite.seed.enabled=false).");
            return;
        }

        long currentCount = restaurantRepository.count();
        if (currentCount >= targetRestaurants) {
            logger.info("Idempotency check passed: Database already contains {} restaurants (target: {}). Seeding skipped.", currentCount, targetRestaurants);
            return;
        }

        if (async) {
            logger.info("Launching background seeding: target={}, current={}, batchSize={}...", targetRestaurants, currentCount, batchSize);
            CompletableFuture.runAsync(() -> {
                try {
                    generate();
                } catch (Exception e) {
                    logger.error("Error during background restaurant seeding: {}", e.getMessage(), e);
                }
            });
        } else {
            generate();
        }
    }

    public void generate() {
        long currentCount = restaurantRepository.count();
        if (currentCount >= targetRestaurants) {
            logger.info("Idempotency check passed: Database already contains {} restaurants (target: {}). Seeding skipped.", currentCount, targetRestaurants);
            return; 
        }

        long needed = targetRestaurants - currentCount;
        logger.info("Starting Indian Restaurant Demo Data Generation: target={}, current={}, needed={}, batchSize={}...",
                targetRestaurants, currentCount, needed, batchSize);

        // Load existing keys to guarantee idempotency and avoid duplicates
        Set<String> existingKeys = new HashSet<>();
        List<Restaurant> existing = restaurantRepository.findAll();
        if (existing != null) {
            for (Restaurant r : existing) {
                existingKeys.add(toKey(r.getName(), r.getAddress(), r.getCity()));
            }
        }

        List<Restaurant> restaurantBatch = new ArrayList<>();
        Random random = new Random(42); // Deterministic pseudo-random seed
        int newlyAddedCount = 0;
        int candidateIndex = 0;
        int maxAttempts = Math.max(targetRestaurants * 3, 30000);

        while ((currentCount + newlyAddedCount) < targetRestaurants && candidateIndex < maxAttempts) {
            CityInfo city = CITIES[candidateIndex % CITIES.length];
            String area = city.areas[random.nextInt(city.areas.length)];
            
            String name = PREFIXES[random.nextInt(PREFIXES.length)] + " " + NOUNS[random.nextInt(NOUNS.length)];
            String cuisine = CUISINES[random.nextInt(CUISINES.length)];
            
            // City-consistent realistic coordinates spread across a ~5-10km radius
            double latOffset = (random.nextDouble() - 0.5) * 0.1;
            double lngOffset = (random.nextDouble() - 0.5) * 0.1;
            double lat = city.lat + latOffset;
            double lng = city.lng + lngOffset;
            
            double rating = 3.5 + (random.nextDouble() * 1.4); // 3.5 to 4.9
            int reviewCount = 50 + random.nextInt(950);
            int priceRange = 1 + random.nextInt(4); // 1 to 4
            int deliveryTimeMinutes = 20 + random.nextInt(40); // 20 to 59
            
            String openingHours = HOURS[random.nextInt(HOURS.length)];
            double deliveryRadius = 3.0 + (random.nextDouble() * 7.0);
            
            // Realistic Indian Address
            String[] streetTypes = {"Marg", "Road", "Cross", "Main", "Street"};
            String address = "Shop " + (random.nextInt(150) + 1) + ", " + 
                             (random.nextInt(20) + 1) + "th " + streetTypes[random.nextInt(streetTypes.length)] + ", " + 
                             area;
                             
            String coverImageUrl = ImageConstants.RESTAURANT_IMAGES[random.nextInt(ImageConstants.RESTAURANT_IMAGES.length)];
            
            candidateIndex++;

            String key = toKey(name, address, city.name);
            if (existingKeys.contains(key)) {
                continue; // Skip already seeded or existing restaurant
            }

            Restaurant r = new Restaurant(
                name, cuisine, area, Math.round(rating * 10.0) / 10.0,
                address, city.name, area, lat, lng, openingHours, Math.round(deliveryRadius * 10.0) / 10.0,
                coverImageUrl
            );
            
            r.setReviewCount(reviewCount);
            r.setPriceRange(priceRange);
            r.setDeliveryAvailability(true);
            r.setDeliveryTimeMinutes(deliveryTimeMinutes);
            r.setStatus(RestaurantStatus.APPROVED);
            
            existingKeys.add(key);
            restaurantBatch.add(r);
            newlyAddedCount++;
            
            if (restaurantBatch.size() >= batchSize) {
                saveBatch(restaurantBatch, random);
                restaurantBatch = new ArrayList<>();
            }
        }
        
        if (!restaurantBatch.isEmpty()) {
            saveBatch(restaurantBatch, random);
        }
        
        logger.info("Successfully seeded {} new Indian restaurants. Total target reached: {}.", newlyAddedCount, (currentCount + newlyAddedCount));
    }
    
    private void saveBatch(List<Restaurant> batch, Random random) {
        if (transactionTemplate != null) {
            transactionTemplate.executeWithoutResult(status -> doSaveBatch(batch, random));
        } else {
            doSaveBatch(batch, random);
        }
    }

    private void doSaveBatch(List<Restaurant> batch, Random random) {
        List<Restaurant> savedRestaurants = restaurantRepository.saveAll(batch);
        List<MenuItem> menus = new ArrayList<>();
        for (Restaurant r : savedRestaurants) {
            int numItems = 5 + random.nextInt(8); // 5 to 12 items
            for (int j = 0; j < numItems; j++) {
                String itemName = MENU_ITEMS[random.nextInt(MENU_ITEMS.length)];
                if (j > 0) itemName += " " + (j + 1); // Make unique
                
                double priceVal = 99.0 + random.nextInt(400);
                String imageUrl = ImageConstants.MENU_IMAGES[random.nextInt(ImageConstants.MENU_IMAGES.length)];
                menus.add(new MenuItem(r.getId(), itemName, "Authentic " + itemName, BigDecimal.valueOf(priceVal), true, imageUrl));
            }
        }
        menuItemRepository.saveAll(menus);
        logger.info("Committed batch of {} restaurants and {} menus.", batch.size(), menus.size());
    }

    private String toKey(String name, String address, String city) {
        return (name != null ? name.trim().toLowerCase() : "") + "|"
             + (address != null ? address.trim().toLowerCase() : "") + "|"
             + (city != null ? city.trim().toLowerCase() : "");
    }
}
