package com.quickbite.delivery;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith(MockitoExtension.class)
class DeliveryControllerTest {

    @Mock
    private DeliveryService deliveryService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new DeliveryController(deliveryService)).build();
    }

    @Test
    void createsDeliveryWithCreatedStatus() throws Exception {
        when(deliveryService.createDeliveryForOrder(1L))
                .thenReturn(new Delivery(1L, "Rahul Driver", "9999999999", DeliveryStatus.ASSIGNING));

        mockMvc.perform(post("/api/deliveries/orders/1"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ASSIGNING"));
    }

    @Test
    void rejectsInvalidStatusValueWithBadRequest() throws Exception {
        mockMvc.perform(patch("/api/deliveries/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"IN_TRANSIT\"}"))
                .andExpect(status().isBadRequest());

        verify(deliveryService, org.mockito.Mockito.never())
                .updateStatus(org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.any());
    }
}
