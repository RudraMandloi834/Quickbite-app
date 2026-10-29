package com.quickbite.restaurant;

import com.quickbite.menu.MenuItem;
import com.quickbite.menu.MenuItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallbackWithoutResult;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

public class ResumableBatchSeedingTest {

    private RestaurantRepository mockRestaurantRepo;
    private MenuItemRepository mockMenuRepo;
    private TransactionTemplate mockTransactionTemplate;

    @BeforeEach
    public void setup() {
        mockRestaurantRepo = mock(RestaurantRepository.class);
        mockMenuRepo = mock(MenuItemRepository.class);
        mockTransactionTemplate = mock(TransactionTemplate.class);

        // When saveAll is called, return the passed list as saved entities
        when(mockRestaurantRepo.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));
        when(mockMenuRepo.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        // When transactionTemplate.executeWithoutResult is called, execute the consumer
        doAnswer(invocation -> {
            Consumer<TransactionStatus> action = invocation.getArgument(0);
            action.accept(mock(TransactionStatus.class));
            return null;
        }).when(mockTransactionTemplate).executeWithoutResult(any());
    }

    @Test
    @DisplayName("Idempotency: When current count >= target, generator skips without writing")
    public void testIdempotencyWhenTargetAlreadyMet() {
        when(mockRestaurantRepo.count()).thenReturn(10000L);

        SyntheticDataGenerator generator = new SyntheticDataGenerator(mockRestaurantRepo, mockMenuRepo, mockTransactionTemplate);
        generator.setTargetRestaurants(10000);
        generator.setAsync(false);

        generator.generate();

        verify(mockRestaurantRepo, never()).saveAll(anyList());
        verify(mockMenuRepo, never()).saveAll(anyList());
        verify(mockRestaurantRepo, never()).findAll();
        verify(mockRestaurantRepo, never()).delete(any(Restaurant.class));
        verify(mockRestaurantRepo, never()).deleteAll(anyList());
    }

    @Test
    @DisplayName("Resumable Seeding: Keeps existing 84 restaurants, seeds missing up to target, avoids duplicate keys")
    @SuppressWarnings("unchecked")
    public void testResumeFromPartial84SeedPreservesExistingAndAvoidsDuplicates() {
        // Mock existing 84 restaurants with distinct name/address/city
        List<Restaurant> existing84 = new ArrayList<>();
        Set<String> existingKeys = new HashSet<>();
        for (int i = 0; i < 84; i++) {
            String name = "Restaurant " + i;
            String address = "Shop " + (i + 1) + ", Main St, Area " + (i % 5);
            String city = "City" + (i % 10);
            Restaurant r = new Restaurant(name, "Indian", "Area", 4.0, address, city, "Area", 20.0, 75.0, "10-10", 5.0, "img");
            existing84.add(r);
            existingKeys.add(name.toLowerCase() + "|" + address.toLowerCase() + "|" + city.toLowerCase());
        }

        when(mockRestaurantRepo.count()).thenReturn(84L);
        when(mockRestaurantRepo.findAll()).thenReturn(existing84);

        SyntheticDataGenerator generator = new SyntheticDataGenerator(mockRestaurantRepo, mockMenuRepo, mockTransactionTemplate);
        generator.setTargetRestaurants(200);
        generator.setBatchSize(50);
        generator.setAsync(false);

        generator.generate();

        ArgumentCaptor<List<Restaurant>> captor = ArgumentCaptor.forClass(List.class);
        verify(mockRestaurantRepo, times(3)).saveAll(captor.capture());

        List<List<Restaurant>> batches = captor.getAllValues();
        assertEquals(3, batches.size());
        assertEquals(50, batches.get(0).size(), "First batch should contain 50 items");
        assertEquals(50, batches.get(1).size(), "Second batch should contain 50 items");
        assertEquals(16, batches.get(2).size(), "Third batch should contain remaining 16 items");

        int newlySavedTotal = batches.stream().mapToInt(List::size).sum();
        assertEquals(116, newlySavedTotal, "Must seed exactly 116 records (200 target - 84 existing)");

        // Verify no duplicate keys with existing 84
        for (List<Restaurant> batch : batches) {
            for (Restaurant r : batch) {
                String key = r.getName().toLowerCase() + "|" + r.getAddress().toLowerCase() + "|" + r.getCity().toLowerCase();
                assertFalse(existingKeys.contains(key), "Newly generated restaurant must not collide with existing 84: " + key);
            }
        }

        // Verify existing records were NEVER deleted
        verify(mockRestaurantRepo, never()).delete(any(Restaurant.class));
        verify(mockRestaurantRepo, never()).deleteAll(anyList());
        verify(mockMenuRepo, never()).delete(any(MenuItem.class));
        verify(mockMenuRepo, never()).deleteAll(anyList());
    }

    @Test
    @DisplayName("Chunked Batching: Correctly splits target into configured batch sizes and commits menu items")
    @SuppressWarnings("unchecked")
    public void testChunkedBatching() {
        when(mockRestaurantRepo.count()).thenReturn(0L);
        when(mockRestaurantRepo.findAll()).thenReturn(new ArrayList<>());

        SyntheticDataGenerator generator = new SyntheticDataGenerator(mockRestaurantRepo, mockMenuRepo, mockTransactionTemplate);
        generator.setTargetRestaurants(250);
        generator.setBatchSize(100);
        generator.setAsync(false);

        generator.generate();

        ArgumentCaptor<List<Restaurant>> restaurantCaptor = ArgumentCaptor.forClass(List.class);
        verify(mockRestaurantRepo, times(3)).saveAll(restaurantCaptor.capture());

        List<List<Restaurant>> batches = restaurantCaptor.getAllValues();
        assertEquals(100, batches.get(0).size());
        assertEquals(100, batches.get(1).size());
        assertEquals(50, batches.get(2).size());

        int totalSaved = batches.stream().mapToInt(List::size).sum();
        assertEquals(250, totalSaved);

        // Verify menus saved 3 times (once per batch)
        verify(mockMenuRepo, times(3)).saveAll(anyList());
    }

    @Test
    @DisplayName("Restart Safety: Simulating process crash midway and restarting cleanly to reach target")
    @SuppressWarnings("unchecked")
    public void testRestartSafetySimulatingInterruptedDeployment() {
        // Run 1: fresh start targeting 100 with batch size 30
        when(mockRestaurantRepo.count()).thenReturn(0L);
        when(mockRestaurantRepo.findAll()).thenReturn(new ArrayList<>());

        SyntheticDataGenerator generatorRun1 = new SyntheticDataGenerator(mockRestaurantRepo, mockMenuRepo, null);
        generatorRun1.setTargetRestaurants(100);
        generatorRun1.setBatchSize(30);
        generatorRun1.setAsync(false);

        generatorRun1.generate();

        ArgumentCaptor<List<Restaurant>> captor1 = ArgumentCaptor.forClass(List.class);
        verify(mockRestaurantRepo, times(4)).saveAll(captor1.capture()); // 30, 30, 30, 10

        List<Restaurant> allRun1 = new ArrayList<>();
        for (List<Restaurant> b : captor1.getAllValues()) {
            allRun1.addAll(b);
        }
        assertEquals(100, allRun1.size());

        // Now simulate crash after first 2 batches were committed (60 restaurants persisted)
        List<Restaurant> persisted60 = allRun1.subList(0, 60);

        RestaurantRepository mockRepo2 = mock(RestaurantRepository.class);
        MenuItemRepository mockMenuRepo2 = mock(MenuItemRepository.class);
        when(mockRepo2.count()).thenReturn(60L);
        when(mockRepo2.findAll()).thenReturn(new ArrayList<>(persisted60));
        when(mockRepo2.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        // Run 2: dyno restarts, count is 60, target is 100
        SyntheticDataGenerator generatorRun2 = new SyntheticDataGenerator(mockRepo2, mockMenuRepo2, null);
        generatorRun2.setTargetRestaurants(100);
        generatorRun2.setBatchSize(30);
        generatorRun2.setAsync(false);

        generatorRun2.generate();

        ArgumentCaptor<List<Restaurant>> captor2 = ArgumentCaptor.forClass(List.class);
        verify(mockRepo2, times(2)).saveAll(captor2.capture()); // 30, 10

        List<Restaurant> allRun2 = new ArrayList<>();
        for (List<Restaurant> b : captor2.getAllValues()) {
            allRun2.addAll(b);
        }
        assertEquals(40, allRun2.size(), "Second run must save only the remaining 40 restaurants");

        // Verify no duplicate keys across run 1 persisted (60) and run 2 (40)
        Set<String> persistedKeys = new HashSet<>();
        for (Restaurant r : persisted60) {
            persistedKeys.add(r.getName().toLowerCase() + "|" + r.getAddress().toLowerCase() + "|" + r.getCity().toLowerCase());
        }
        for (Restaurant r : allRun2) {
            String key = r.getName().toLowerCase() + "|" + r.getAddress().toLowerCase() + "|" + r.getCity().toLowerCase();
            assertFalse(persistedKeys.contains(key), "Run 2 must not regenerate any key already in run 1: " + key);
        }
    }

    @Test
    @DisplayName("TransactionTemplate: Each batch commits in its own transaction")
    public void testTransactionTemplateExecutedForEachBatch() {
        when(mockRestaurantRepo.count()).thenReturn(0L);
        when(mockRestaurantRepo.findAll()).thenReturn(new ArrayList<>());

        SyntheticDataGenerator generator = new SyntheticDataGenerator(mockRestaurantRepo, mockMenuRepo, mockTransactionTemplate);
        generator.setTargetRestaurants(200);
        generator.setBatchSize(100);
        generator.setAsync(false);

        generator.generate();

        // Exactly 2 batches of 100 = 2 transactions
        verify(mockTransactionTemplate, times(2)).executeWithoutResult(any());
    }

    @Test
    @DisplayName("Disabled Seeding: When enabled=false, startSeeding skips immediately")
    public void testDisabledSeeding() {
        when(mockRestaurantRepo.count()).thenReturn(0L);

        SyntheticDataGenerator generator = new SyntheticDataGenerator(mockRestaurantRepo, mockMenuRepo, mockTransactionTemplate);
        generator.setEnabled(false);

        generator.startSeeding();

        verify(mockRestaurantRepo, never()).count();
        verify(mockRestaurantRepo, never()).saveAll(anyList());
    }
}
