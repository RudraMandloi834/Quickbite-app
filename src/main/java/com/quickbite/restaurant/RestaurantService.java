package com.quickbite.restaurant;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;

    public RestaurantService(RestaurantRepository restaurantRepository) {
        this.restaurantRepository = restaurantRepository;
    }

    public List<Restaurant> getAllRestaurants() {
        return restaurantRepository.findAll();
    }

    public Restaurant createRestaurant(CreateRestaurantRequest request) {
        Restaurant restaurant = new Restaurant(
                request.name(),
                request.cuisine(),
                request.location(),
                request.rating()
        );
        return restaurantRepository.save(restaurant);
    }

    public void addSampleRestaurantsIfEmpty() {
        if (restaurantRepository.count() == 0) {
            restaurantRepository.saveAll(List.of(
                    new Restaurant("Spice Garden", "Indian", "Koramangala", 4.5),
                    new Restaurant("Pasta House", "Italian", "Indiranagar", 4.3),
                    new Restaurant("Sushi Express", "Japanese", "MG Road", 4.6)
            ));
        }
    }
}
