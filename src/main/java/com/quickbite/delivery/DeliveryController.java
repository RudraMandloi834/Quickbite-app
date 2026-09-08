package com.quickbite.delivery;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/deliveries")
public class DeliveryController {

    private final DeliveryService deliveryService;
    private final com.quickbite.customer.CustomerRepository customerRepository;

    public DeliveryController(DeliveryService deliveryService, com.quickbite.customer.CustomerRepository customerRepository) {
        this.deliveryService = deliveryService;
        this.customerRepository = customerRepository;
    }

    @PostMapping("/orders/{orderId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Delivery createDelivery(@PathVariable Long orderId) {
        return deliveryService.createDeliveryForOrder(orderId);
    }

    @GetMapping("/{deliveryId}")
    public Delivery getDelivery(@PathVariable Long deliveryId) {
        return deliveryService.getDelivery(deliveryId);
    }

    @GetMapping("/order/{orderId}")
    public Delivery getDeliveryByOrderId(@PathVariable Long orderId) {
        return deliveryService.getDeliveryByOrderId(orderId);
    }

    @GetMapping("/available")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('DRIVER') or hasRole('OPERATOR')")
    public java.util.List<Delivery> getAvailableDeliveries() {
        return deliveryService.getAvailableDeliveries();
    }

    @GetMapping("/driver/me")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('DRIVER') or hasRole('OPERATOR')")
    public java.util.List<Delivery> getMyDeliveries() {
        Long driverId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        return deliveryService.getDeliveriesByDriver(driverId);
    }

    @PostMapping("/{deliveryId}/assign")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('DRIVER') or hasRole('OPERATOR')")
    public Delivery assignDriver(@PathVariable Long deliveryId) {
        Long driverId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        com.quickbite.customer.Customer driver = customerRepository.findById(driverId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));
        return deliveryService.assignDriver(deliveryId, driverId, driver.getName(), driver.getPhone());
    }

    @PatchMapping("/{deliveryId}/status")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('DRIVER') or hasRole('OPERATOR')")
    public Delivery updateStatus(
            @PathVariable Long deliveryId,
            @RequestBody UpdateDeliveryStatusRequest request
    ) {
        Long driverId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        return deliveryService.updateStatus(deliveryId, request.status(), driverId);
    }
}
