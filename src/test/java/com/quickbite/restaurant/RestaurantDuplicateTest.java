package com.quickbite.restaurant;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class RestaurantDuplicateTest {

    @Mock
    private RestaurantRepository restaurantRepository;

    @Mock
    private com.quickbite.customer.CustomerRepository customerRepository;

    @InjectMocks
    private RestaurantService restaurantService;

    @Test
    void rejectsDuplicateRestaurantApplication() {
        CreateRestaurantRequest request = new CreateRestaurantRequest("phone", "email", "09:00", "22:00", 
                "Duplicate Burger", "Fast Food", "123 Main St", 0.0, "123 Main St", "City", "Area", 0.0, 0.0, "9AM-9PM", 5.0, ""
        );

        when(restaurantRepository.existsByName("Duplicate Burger")).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            restaurantService.applyForRestaurant(request, 1L);
        });

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        assertEquals("Restaurant with this name already exists or is pending approval.", ex.getReason());
    }
}
