package com.quickbite.delivery;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import com.quickbite.order.Order;
import com.quickbite.order.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DeliveryServiceTest {

    @Mock
    private DeliveryRepository deliveryRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    private DeliveryService deliveryService;

    @BeforeEach
    void setUp() {
        deliveryService = new DeliveryService(deliveryRepository, orderRepository, messagingTemplate);
    }

    @Test
    void createsAssignedDeliveryForConfirmedOrder() {
        Order order = confirmedOrder();
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(deliveryRepository.existsByOrderId(1L)).thenReturn(false);
        when(deliveryRepository.save(any(Delivery.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Delivery delivery = deliveryService.createDeliveryForOrder(1L);

        assertEquals(1L, delivery.getOrderId());
        assertEquals(null, delivery.getDriverName());
        assertEquals(null, delivery.getDriverPhone());
        assertEquals(DeliveryStatus.ASSIGNING, delivery.getStatus());
    }

    @Test
    void returnsNotFoundForMissingOrder() {
        when(orderRepository.findById(99L)).thenReturn(Optional.empty());

        assertStatus(HttpStatus.NOT_FOUND, () -> deliveryService.createDeliveryForOrder(99L));
    }

    @Test
    void returnsConflictForPendingOrder() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(new Order(1L, 1L, BigDecimal.TEN)));

        assertStatus(HttpStatus.CONFLICT, () -> deliveryService.createDeliveryForOrder(1L));
    }

    @Test
    void returnsConflictForCancelledOrder() {
        Order order = new Order(1L, 1L, BigDecimal.TEN);
        order.cancel();
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        assertStatus(HttpStatus.CONFLICT, () -> deliveryService.createDeliveryForOrder(1L));
    }

    @Test
    void returnsConflictForDuplicateDelivery() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(confirmedOrder()));
        when(deliveryRepository.existsByOrderId(1L)).thenReturn(true);

        assertStatus(HttpStatus.CONFLICT, () -> deliveryService.createDeliveryForOrder(1L));
    }

    @Test
    void getsExistingDelivery() {
        Delivery delivery = assignedDelivery();
        when(deliveryRepository.findById(1L)).thenReturn(Optional.of(delivery));

        assertEquals(delivery, deliveryService.getDelivery(1L));
    }

    @Test
    void returnsNotFoundForMissingDelivery() {
        when(deliveryRepository.findById(99L)).thenReturn(Optional.empty());

        assertStatus(HttpStatus.NOT_FOUND, () -> deliveryService.getDelivery(99L));
    }

    @Test
    void advancesFromAssigningToAssigned() {
        Delivery delivery = updateExistingDelivery(DeliveryStatus.ASSIGNING);
        when(deliveryRepository.save(delivery)).thenReturn(delivery);

        Delivery updated = deliveryService.updateStatus(1L, DeliveryStatus.ASSIGNED, 1L);

        assertEquals(DeliveryStatus.ASSIGNED, updated.getStatus());
        verify(deliveryRepository).save(delivery);
    }

    @Test
    void advancesFromAssignedToPickedUp() {
        Delivery delivery = updateExistingDelivery(DeliveryStatus.ASSIGNED);
        when(deliveryRepository.save(delivery)).thenReturn(delivery);

        Delivery updated = deliveryService.updateStatus(1L, DeliveryStatus.PICKED_UP, 1L);

        assertEquals(DeliveryStatus.PICKED_UP, updated.getStatus());
        verify(deliveryRepository).save(delivery);
    }

    @Test
    void advancesFromPickedUpToOutForDelivery() {
        Delivery delivery = updateExistingDelivery(DeliveryStatus.PICKED_UP);
        when(deliveryRepository.save(delivery)).thenReturn(delivery);

        Delivery updated = deliveryService.updateStatus(1L, DeliveryStatus.OUT_FOR_DELIVERY, 1L);

        assertEquals(DeliveryStatus.OUT_FOR_DELIVERY, updated.getStatus());
    }

    @Test
    void advancesFromOutForDeliveryToDelivered() {
        Delivery delivery = updateExistingDelivery(DeliveryStatus.OUT_FOR_DELIVERY);
        when(deliveryRepository.save(delivery)).thenReturn(delivery);

        Delivery updated = deliveryService.updateStatus(1L, DeliveryStatus.DELIVERED, 1L);

        assertEquals(DeliveryStatus.DELIVERED, updated.getStatus());
    }

    @Test
    void rejectsInvalidTransition() {
        updateExistingDelivery(DeliveryStatus.ASSIGNING);

        assertStatus(HttpStatus.CONFLICT, () -> deliveryService.updateStatus(1L, DeliveryStatus.DELIVERED, 1L));
        org.mockito.Mockito.verifyNoInteractions(messagingTemplate);
    }

    @Test
    void rejectsChangesToDeliveredDelivery() {
        updateExistingDelivery(DeliveryStatus.DELIVERED);

        assertStatus(HttpStatus.CONFLICT, () -> deliveryService.updateStatus(1L, DeliveryStatus.PICKED_UP, 1L));
        org.mockito.Mockito.verifyNoInteractions(messagingTemplate);
    }

    @Test
    void rejectsChangesFromDifferentDriver() {
        Delivery delivery = updateExistingDelivery(DeliveryStatus.ASSIGNED);
        delivery.setDriver(99L, "Other Driver", "111");

        assertStatus(HttpStatus.FORBIDDEN, () -> deliveryService.updateStatus(1L, DeliveryStatus.PICKED_UP, 1L));
        org.mockito.Mockito.verifyNoInteractions(messagingTemplate);
    }

    private Order confirmedOrder() {
        Order order = new Order(1L, 1L, BigDecimal.TEN);
        order.confirm();
        return order;
    }

    private Delivery assignedDelivery() {
        return new Delivery(1L, "Rahul Driver", "9999999999", DeliveryStatus.ASSIGNING);
    }

    private Delivery updateExistingDelivery(DeliveryStatus status) {
        Delivery delivery = new Delivery(1L, "Rahul Driver", "9999999999", status);
        delivery.setDriver(1L, "Rahul Driver", "9999999999");
        when(deliveryRepository.findById(1L)).thenReturn(Optional.of(delivery));
        return delivery;
    }

    private void assertStatus(HttpStatus expectedStatus, Runnable action) {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, action::run);
        assertEquals(expectedStatus, exception.getStatusCode());
    }
}
