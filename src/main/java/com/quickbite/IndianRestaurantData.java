package com.quickbite;

import com.quickbite.restaurant.Restaurant;
import com.quickbite.restaurant.RestaurantStatus;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class IndianRestaurantData {
    public static final String[] CITIES = {
        "Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune",
        "Ahmedabad", "Jaipur", "Lucknow", "Indore", "Bhopal", "Chandigarh",
        "Surat", "Nagpur", "Patna", "Kochi", "Coimbatore", "Vadodara",
        "Visakhapatnam", "Nashik", "Mysuru", "Goa"
    };

    public static final double[][] CITY_COORDS = {
        {28.7041, 77.1025}, {19.0760, 72.8777}, {12.9716, 77.5946}, {17.3850, 78.4867}, {13.0827, 80.2707}, {22.5726, 88.3639}, {18.5204, 73.8567},
        {23.0225, 72.5714}, {26.9124, 75.7873}, {26.8467, 80.9462}, {22.7196, 75.8577}, {23.2599, 77.4126}, {30.7333, 76.7794},
        {21.1702, 72.8311}, {21.1458, 79.0882}, {25.5941, 85.1376}, {9.9312, 76.2673}, {11.0168, 76.9558}, {22.3072, 73.1812},
        {17.6868, 83.2185}, {20.0110, 73.7903}, {12.2958, 76.6394}, {15.2993, 74.1240}
    };

    public static final String[] CUISINES = {
        "North Indian", "South Indian", "Mughlai", "Chinese", "Street Food", "Biryani", "Desserts", "Bakery", "Beverages", "Fast Food", "Italian", "Healthy Food"
    };

    public static final String[] PREFIXES = {
        "The Great", "Royal", "Spicy", "Authentic", "Golden", "Grand", "New", "Shree", "Maharaja", "Bombay", "Delhi", "Special"
    };

    public static final String[] SUFFIXES = {
        "Dhaba", "Bistro", "Cafe", "Restaurant", "Kitchen", "Tandoor", "Darbar", "Sweets", "Bakers", "Eatery", "Point", "Corner"
    };

    public static final String[] AREAS = {
        "Downtown", "MG Road", "Station Road", "Main Market", "Civil Lines", "High Street", "City Center", "Sector 14", "Mall Road", "Phase 1"
    };

    public static final String[] IMAGES = {
        "https://loremflickr.com/800/600/restaurant,food?random=1",
        "https://loremflickr.com/800/600/restaurant,food?random=2",
        "https://loremflickr.com/800/600/restaurant,food?random=3",
        "https://loremflickr.com/800/600/restaurant,food?random=4",
        "https://loremflickr.com/800/600/restaurant,food?random=5",
        "https://loremflickr.com/800/600/restaurant,food?random=6",
        "https://loremflickr.com/800/600/restaurant,food?random=7",
        "https://loremflickr.com/800/600/restaurant,food?random=8",
        "https://loremflickr.com/800/600/restaurant,food?random=9",
        "https://loremflickr.com/800/600/restaurant,food?random=10",
        "https://loremflickr.com/800/600/restaurant,food?random=11",
        "https://loremflickr.com/800/600/restaurant,food?random=12",
        "https://loremflickr.com/800/600/restaurant,food?random=13",
        "https://loremflickr.com/800/600/restaurant,food?random=14",
        "https://loremflickr.com/800/600/restaurant,food?random=15",
        "https://loremflickr.com/800/600/restaurant,food?random=16",
        "https://loremflickr.com/800/600/restaurant,food?random=17",
        "https://loremflickr.com/800/600/restaurant,food?random=18",
        "https://loremflickr.com/800/600/restaurant,food?random=19",
        "https://loremflickr.com/800/600/restaurant,food?random=20",
        "https://loremflickr.com/800/600/restaurant,food?random=21",
        "https://loremflickr.com/800/600/restaurant,food?random=22",
        "https://loremflickr.com/800/600/restaurant,food?random=23",
        "https://loremflickr.com/800/600/restaurant,food?random=24",
        "https://loremflickr.com/800/600/restaurant,food?random=25",
        "https://loremflickr.com/800/600/restaurant,food?random=26",
        "https://loremflickr.com/800/600/restaurant,food?random=27",
        "https://loremflickr.com/800/600/restaurant,food?random=28",
        "https://loremflickr.com/800/600/restaurant,food?random=29",
        "https://loremflickr.com/800/600/restaurant,food?random=30",
        "https://loremflickr.com/800/600/restaurant,food?random=31",
        "https://loremflickr.com/800/600/restaurant,food?random=32",
        "https://loremflickr.com/800/600/restaurant,food?random=33",
        "https://loremflickr.com/800/600/restaurant,food?random=34",
        "https://loremflickr.com/800/600/restaurant,food?random=35",
        "https://loremflickr.com/800/600/restaurant,food?random=36",
        "https://loremflickr.com/800/600/restaurant,food?random=37",
        "https://loremflickr.com/800/600/restaurant,food?random=38",
        "https://loremflickr.com/800/600/restaurant,food?random=39",
        "https://loremflickr.com/800/600/restaurant,food?random=40",
        "https://loremflickr.com/800/600/restaurant,food?random=41",
        "https://loremflickr.com/800/600/restaurant,food?random=42",
        "https://loremflickr.com/800/600/restaurant,food?random=43",
        "https://loremflickr.com/800/600/restaurant,food?random=44",
        "https://loremflickr.com/800/600/restaurant,food?random=45",
        "https://loremflickr.com/800/600/restaurant,food?random=46",
        "https://loremflickr.com/800/600/restaurant,food?random=47",
        "https://loremflickr.com/800/600/restaurant,food?random=48",
        "https://loremflickr.com/800/600/restaurant,food?random=49",
        "https://loremflickr.com/800/600/restaurant,food?random=50",
        "https://loremflickr.com/800/600/restaurant,food?random=51",
        "https://loremflickr.com/800/600/restaurant,food?random=52",
        "https://loremflickr.com/800/600/restaurant,food?random=53",
        "https://loremflickr.com/800/600/restaurant,food?random=54",
        "https://loremflickr.com/800/600/restaurant,food?random=55",
        "https://loremflickr.com/800/600/restaurant,food?random=56",
        "https://loremflickr.com/800/600/restaurant,food?random=57",
        "https://loremflickr.com/800/600/restaurant,food?random=58",
        "https://loremflickr.com/800/600/restaurant,food?random=59",
        "https://loremflickr.com/800/600/restaurant,food?random=60",
        "https://loremflickr.com/800/600/restaurant,food?random=61",
        "https://loremflickr.com/800/600/restaurant,food?random=62",
        "https://loremflickr.com/800/600/restaurant,food?random=63",
        "https://loremflickr.com/800/600/restaurant,food?random=64",
        "https://loremflickr.com/800/600/restaurant,food?random=65",
        "https://loremflickr.com/800/600/restaurant,food?random=66",
        "https://loremflickr.com/800/600/restaurant,food?random=67",
        "https://loremflickr.com/800/600/restaurant,food?random=68",
        "https://loremflickr.com/800/600/restaurant,food?random=69",
        "https://loremflickr.com/800/600/restaurant,food?random=70",
        "https://loremflickr.com/800/600/restaurant,food?random=71",
        "https://loremflickr.com/800/600/restaurant,food?random=72",
        "https://loremflickr.com/800/600/restaurant,food?random=73",
        "https://loremflickr.com/800/600/restaurant,food?random=74",
        "https://loremflickr.com/800/600/restaurant,food?random=75",
        "https://loremflickr.com/800/600/restaurant,food?random=76",
        "https://loremflickr.com/800/600/restaurant,food?random=77",
        "https://loremflickr.com/800/600/restaurant,food?random=78",
        "https://loremflickr.com/800/600/restaurant,food?random=79",
        "https://loremflickr.com/800/600/restaurant,food?random=80",
        "https://loremflickr.com/800/600/restaurant,food?random=81",
        "https://loremflickr.com/800/600/restaurant,food?random=82",
        "https://loremflickr.com/800/600/restaurant,food?random=83",
        "https://loremflickr.com/800/600/restaurant,food?random=84",
        "https://loremflickr.com/800/600/restaurant,food?random=85",
        "https://loremflickr.com/800/600/restaurant,food?random=86",
        "https://loremflickr.com/800/600/restaurant,food?random=87",
        "https://loremflickr.com/800/600/restaurant,food?random=88",
        "https://loremflickr.com/800/600/restaurant,food?random=89",
        "https://loremflickr.com/800/600/restaurant,food?random=90",
        "https://loremflickr.com/800/600/restaurant,food?random=91",
        "https://loremflickr.com/800/600/restaurant,food?random=92",
        "https://loremflickr.com/800/600/restaurant,food?random=93",
        "https://loremflickr.com/800/600/restaurant,food?random=94",
        "https://loremflickr.com/800/600/restaurant,food?random=95",
        "https://loremflickr.com/800/600/restaurant,food?random=96",
        "https://loremflickr.com/800/600/restaurant,food?random=97",
        "https://loremflickr.com/800/600/restaurant,food?random=98",
        "https://loremflickr.com/800/600/restaurant,food?random=99",
        "https://loremflickr.com/800/600/restaurant,food?random=100",
        "https://loremflickr.com/800/600/restaurant,food?random=101",
        "https://loremflickr.com/800/600/restaurant,food?random=102",
        "https://loremflickr.com/800/600/restaurant,food?random=103",
        "https://loremflickr.com/800/600/restaurant,food?random=104",
        "https://loremflickr.com/800/600/restaurant,food?random=105",
        "https://loremflickr.com/800/600/restaurant,food?random=106",
        "https://loremflickr.com/800/600/restaurant,food?random=107",
        "https://loremflickr.com/800/600/restaurant,food?random=108",
        "https://loremflickr.com/800/600/restaurant,food?random=109",
        "https://loremflickr.com/800/600/restaurant,food?random=110",
        "https://loremflickr.com/800/600/restaurant,food?random=111",
        "https://loremflickr.com/800/600/restaurant,food?random=112",
        "https://loremflickr.com/800/600/restaurant,food?random=113",
        "https://loremflickr.com/800/600/restaurant,food?random=114",
        "https://loremflickr.com/800/600/restaurant,food?random=115",
        "https://loremflickr.com/800/600/restaurant,food?random=116",
        "https://loremflickr.com/800/600/restaurant,food?random=117",
        "https://loremflickr.com/800/600/restaurant,food?random=118",
        "https://loremflickr.com/800/600/restaurant,food?random=119",
        "https://loremflickr.com/800/600/restaurant,food?random=120",
        "https://loremflickr.com/800/600/restaurant,food?random=121",
        "https://loremflickr.com/800/600/restaurant,food?random=122",
        "https://loremflickr.com/800/600/restaurant,food?random=123",
        "https://loremflickr.com/800/600/restaurant,food?random=124",
        "https://loremflickr.com/800/600/restaurant,food?random=125",
        "https://loremflickr.com/800/600/restaurant,food?random=126",
        "https://loremflickr.com/800/600/restaurant,food?random=127",
        "https://loremflickr.com/800/600/restaurant,food?random=128",
        "https://loremflickr.com/800/600/restaurant,food?random=129",
        "https://loremflickr.com/800/600/restaurant,food?random=130",
        "https://loremflickr.com/800/600/restaurant,food?random=131",
        "https://loremflickr.com/800/600/restaurant,food?random=132",
        "https://loremflickr.com/800/600/restaurant,food?random=133",
        "https://loremflickr.com/800/600/restaurant,food?random=134",
        "https://loremflickr.com/800/600/restaurant,food?random=135",
        "https://loremflickr.com/800/600/restaurant,food?random=136",
        "https://loremflickr.com/800/600/restaurant,food?random=137",
        "https://loremflickr.com/800/600/restaurant,food?random=138",
        "https://loremflickr.com/800/600/restaurant,food?random=139",
        "https://loremflickr.com/800/600/restaurant,food?random=140",
        "https://loremflickr.com/800/600/restaurant,food?random=141",
        "https://loremflickr.com/800/600/restaurant,food?random=142",
        "https://loremflickr.com/800/600/restaurant,food?random=143",
        "https://loremflickr.com/800/600/restaurant,food?random=144",
        "https://loremflickr.com/800/600/restaurant,food?random=145",
        "https://loremflickr.com/800/600/restaurant,food?random=146",
        "https://loremflickr.com/800/600/restaurant,food?random=147",
        "https://loremflickr.com/800/600/restaurant,food?random=148",
        "https://loremflickr.com/800/600/restaurant,food?random=149",
        "https://loremflickr.com/800/600/restaurant,food?random=150"
    };

    public static List<Restaurant> generate(int count) {
        List<Restaurant> list = new ArrayList<>();
        Random rnd = new Random(42); // deterministic

        for (int i = 0; i < count; i++) {
            int cityIdx = rnd.nextInt(CITIES.length);
            String city = CITIES[cityIdx];
            double baseLat = CITY_COORDS[cityIdx][0];
            double baseLng = CITY_COORDS[cityIdx][1];
            
            String name = PREFIXES[rnd.nextInt(PREFIXES.length)] + " " + SUFFIXES[rnd.nextInt(SUFFIXES.length)] + " " + (i+1);
            String cuisine = CUISINES[rnd.nextInt(CUISINES.length)];
            String area = AREAS[rnd.nextInt(AREAS.length)];
            String address = (rnd.nextInt(900) + 100) + " " + area;
            
            double lat = baseLat + (rnd.nextDouble() - 0.5) * 0.2;
            double lng = baseLng + (rnd.nextDouble() - 0.5) * 0.2;
            double rating = 3.0 + (rnd.nextDouble() * 2.0); // 3.0 to 5.0
            
            String image = IMAGES[rnd.nextInt(IMAGES.length)];
            
            Restaurant r = new Restaurant(
                    name,
                    cuisine,
                    address,
                    rating,
                    address,
                    city,
                    area,
                    lat,
                    lng,
                    "09:00 - 22:00",
                    5.0,
                    image
            );
            r.setStatus(RestaurantStatus.APPROVED);
            r.setReviewCount(rnd.nextInt(1000) + 10);
            r.setPriceRange(rnd.nextInt(4) + 1);
            r.setDeliveryAvailability(rnd.nextBoolean() || rnd.nextBoolean()); // mostly true
            list.add(r);
        }
        return list;
    }
}
