package com.quickbite.menu;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/restaurants/{restaurantId}/menu")
public class MenuItemController {

    private final MenuItemService menuItemService;

    public MenuItemController(MenuItemService menuItemService) {
        this.menuItemService = menuItemService;
    }

    @GetMapping
    public List<MenuItem> getMenuItems(@PathVariable Long restaurantId) {
        return menuItemService.getMenuItems(restaurantId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MenuItem createMenuItem(
            @PathVariable Long restaurantId,
            @RequestBody CreateMenuItemRequest request
    ) {
        validate(request);
        return menuItemService.createMenuItem(restaurantId, request);
    }

    private void validate(CreateMenuItemRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name must not be blank");
        }
        if (request.description() == null || request.description().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description must not be blank");
        }
        if (request.price() == null || request.price().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Price must be greater than 0");
        }
        if (request.available() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Available must be provided");
        }
    }

    @org.springframework.web.bind.annotation.PutMapping("/{menuItemId}")
    public MenuItem updateMenuItem(
            @PathVariable Long restaurantId,
            @PathVariable Long menuItemId,
            @RequestBody CreateMenuItemRequest request
    ) {
        validate(request);
        return menuItemService.updateMenuItem(restaurantId, menuItemId, request);
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{menuItemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMenuItem(
            @PathVariable Long restaurantId,
            @PathVariable Long menuItemId
    ) {
        menuItemService.deleteMenuItem(restaurantId, menuItemId);
    }
}
