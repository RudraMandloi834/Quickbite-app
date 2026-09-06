package com.quickbite.restaurant;

import com.quickbite.menu.MenuItemRepository;
import com.quickbite.menu.MenuItem;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.stubbing.Answer;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

public class SyntheticDataGeneratorTest {

    @Test
    @SuppressWarnings("unchecked")
    public void testGenerateSeedsDataAndDistributesCities() {
        RestaurantRepository mockRestaurantRepo = mock(RestaurantRepository.class);
        MenuItemRepository mockMenuRepo = mock(MenuItemRepository.class);

        when(mockRestaurantRepo.count()).thenReturn(0L);

        // When saveAll is called, just return the list back to simulate saved entities (even though IDs are null, it's fine for our test counts)
        when(mockRestaurantRepo.saveAll(anyList())).thenAnswer((Answer<List<Restaurant>>) invocation -> {
            return (List<Restaurant>) invocation.getArgument(0);
        });
        when(mockMenuRepo.saveAll(anyList())).thenAnswer((Answer<List<MenuItem>>) invocation -> {
            return (List<MenuItem>) invocation.getArgument(0);
        });

        SyntheticDataGenerator generator = new SyntheticDataGenerator(mockRestaurantRepo, mockMenuRepo);
        generator.generate();

        ArgumentCaptor<List<Restaurant>> captor = ArgumentCaptor.forClass(List.class);
        
        verify(mockRestaurantRepo, times(10)).saveAll(captor.capture());
        
        List<List<Restaurant>> allBatches = captor.getAllValues();
        
        int totalRestaurants = 0;
        Map<String, Integer> cityCounts = new HashMap<>();
        
        for (List<Restaurant> batch : allBatches) {
            totalRestaurants += batch.size();
            for (Restaurant r : batch) {
                String city = r.getCity();
                cityCounts.put(city, cityCounts.getOrDefault(city, 0) + 1);
                
                double rating = r.getRating();
                assertTrue(rating >= 3.0 && rating <= 5.0, "Rating out of bounds");
            }
        }
        
        assertEquals(10000, totalRestaurants, "Should generate exactly 10,000 restaurants");
        
        String[] expectedCities = {"Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Chandigarh", "Indore"};
        for (String city : expectedCities) {
            assertTrue(cityCounts.containsKey(city), "Missing city: " + city);
            assertTrue(cityCounts.get(city) > 0, "No restaurants for city: " + city);
        }
        
        // Check menus are generated
        verify(mockMenuRepo, times(10)).saveAll(anyList());
    }
}
