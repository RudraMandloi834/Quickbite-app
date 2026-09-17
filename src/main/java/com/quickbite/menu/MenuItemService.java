package com.quickbite.menu;

import java.util.List;

import com.quickbite.restaurant.Restaurant;
import com.quickbite.restaurant.RestaurantRepository;
import com.quickbite.restaurant.RestaurantService;
import com.quickbite.restaurant.RestaurantStatus;
import com.quickbite.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final RestaurantRepository restaurantRepository;
    private final RestaurantService restaurantService;

    public MenuItemService(MenuItemRepository menuItemRepository, RestaurantRepository restaurantRepository, RestaurantService restaurantService) {
        this.menuItemRepository = menuItemRepository;
        this.restaurantRepository = restaurantRepository;
        this.restaurantService = restaurantService;
    }

    public List<MenuItem> getMenuItems(Long restaurantId) {
        return menuItemRepository.findByRestaurantId(restaurantId);
    }

    public MenuItem createMenuItem(Long restaurantId, CreateMenuItemRequest request) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Restaurant not found"));

        if (restaurant.getStatus() != null && restaurant.getStatus() != RestaurantStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Restaurant is not approved");
        }

        Long userId = SecurityUtils.getAuthenticatedCustomerId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }

        if (!restaurantService.hasRestaurantAccess(restaurantId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied. Only owner or approved staff can manage menu.");
        }

        MenuItem menuItem = new MenuItem(
                restaurantId,
                request.name(),
                request.description(),
                request.price(),
                request.available()
        );
        return menuItemRepository.save(menuItem);
    }

    public MenuItem updateMenuItem(Long restaurantId, Long menuItemId, CreateMenuItemRequest request) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Restaurant not found"));
        if (restaurant.getStatus() != null && restaurant.getStatus() != RestaurantStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Restaurant is not approved");
        }
        Long userId = SecurityUtils.getAuthenticatedCustomerId();
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        if (!restaurantService.hasRestaurantAccess(restaurantId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu item not found"));
        if (!menuItem.getRestaurantId().equals(restaurantId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu item does not belong to this restaurant");
        }
        menuItem.setName(request.name());
        menuItem.setDescription(request.description());
        menuItem.setPrice(request.price());
        menuItem.setAvailable(request.available());
        return menuItemRepository.save(menuItem);
    }

    public void deleteMenuItem(Long restaurantId, Long menuItemId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Restaurant not found"));
        if (restaurant.getStatus() != null && restaurant.getStatus() != RestaurantStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Restaurant is not approved");
        }
        Long userId = SecurityUtils.getAuthenticatedCustomerId();
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        if (!restaurantService.hasRestaurantAccess(restaurantId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu item not found"));
        if (!menuItem.getRestaurantId().equals(restaurantId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu item does not belong to this restaurant");
        }
        menuItemRepository.delete(menuItem);
    }
}
