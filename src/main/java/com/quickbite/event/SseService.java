package com.quickbite.event;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.Map;
import java.util.List;
@Service
public class SseService {
    private final Map<Long, List<SseEmitter>> customerEmitters = new ConcurrentHashMap<>();
    private final Map<Long, List<SseEmitter>> restaurantEmitters = new ConcurrentHashMap<>();
    private final Map<Long, List<SseEmitter>> driverEmitters = new ConcurrentHashMap<>();
    private final List<SseEmitter> adminEmitters = new CopyOnWriteArrayList<>();
    public SseEmitter subscribe(Long userId, String role) {
        SseEmitter emitter = new SseEmitter(0L);
        if ("ROLE_OPERATOR".equals(role)) adminEmitters.add(emitter);
        else if ("ROLE_CUSTOMER".equals(role)) customerEmitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);
        else if ("ROLE_RESTAURANT_PARTNER".equals(role)) restaurantEmitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);
        else if ("ROLE_DRIVER".equals(role)) driverEmitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);
        Runnable cleanup = () -> removeEmitter(userId, role, emitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError((e) -> cleanup.run());
        return emitter;
    }
    private void removeEmitter(Long userId, String role, SseEmitter emitter) {
        if ("ROLE_OPERATOR".equals(role)) adminEmitters.remove(emitter);
        else if ("ROLE_CUSTOMER".equals(role)) {
            List<SseEmitter> list = customerEmitters.get(userId);
            if (list != null) list.remove(emitter);
        } else if ("ROLE_RESTAURANT_PARTNER".equals(role)) {
            List<SseEmitter> list = restaurantEmitters.get(userId);
            if (list != null) list.remove(emitter);
        } else if ("ROLE_DRIVER".equals(role)) {
            List<SseEmitter> list = driverEmitters.get(userId);
            if (list != null) list.remove(emitter);
        }
    }
    public void emitToCustomer(Long customerId, SystemEvent event) {
        List<SseEmitter> list = customerEmitters.get(customerId);
        if (list != null) sendEvent(list, event);
    }
    public void emitToRestaurant(Long restaurantOwnerId, SystemEvent event) {
        List<SseEmitter> list = restaurantEmitters.get(restaurantOwnerId);
        if (list != null) sendEvent(list, event);
    }
    public void emitToDriver(Long driverId, SystemEvent event) {
        List<SseEmitter> list = driverEmitters.get(driverId);
        if (list != null) sendEvent(list, event);
    }
    public void emitToAllDrivers(SystemEvent event) {
        for (List<SseEmitter> list : driverEmitters.values()) sendEvent(list, event);
    }
    public void emitToAdmins(SystemEvent event) {
        sendEvent(adminEmitters, event);
    }
    private void sendEvent(List<SseEmitter> emitters, SystemEvent event) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().id(event.getEventId()).name(event.getType()).data(event));
            } catch (IOException e) {
                emitter.complete();
            }
        }
    }
    @Scheduled(fixedRate = 15000)
    public void sendHeartbeat() {
        SystemEvent ping = new SystemEvent("ping-" + System.currentTimeMillis(), "PING", null, null, null, null, null);
        for (List<SseEmitter> list : customerEmitters.values()) sendEvent(list, ping);
        for (List<SseEmitter> list : restaurantEmitters.values()) sendEvent(list, ping);
        for (List<SseEmitter> list : driverEmitters.values()) sendEvent(list, ping);
        sendEvent(adminEmitters, ping);
    }
}
