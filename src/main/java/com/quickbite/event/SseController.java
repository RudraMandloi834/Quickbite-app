package com.quickbite.event;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import com.quickbite.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
@RestController
@RequestMapping("/api/events")
public class SseController {
    private final SseService sseService;
    public SseController(SseService sseService) {
        this.sseService = sseService;
    }
    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamEvents() {
        Long userId = SecurityUtils.getAuthenticatedCustomerId();
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthenticated");
        String role = "ROLE_CUSTOMER";
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            for (org.springframework.security.core.GrantedAuthority a : auth.getAuthorities()) {
                role = a.getAuthority();
                break;
            }
        }
        return sseService.subscribe(userId, role);
    }
}
