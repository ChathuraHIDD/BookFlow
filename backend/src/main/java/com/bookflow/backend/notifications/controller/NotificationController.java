package com.bookflow.backend.notifications.controller;

import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bookflow.backend.auth.dto.MessageResponse;
import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.notifications.dto.NotificationResponse;
import com.bookflow.backend.notifications.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('STUDENT','STAFF_MEMBER','ADMIN','TECHNICIAN')")
    public List<NotificationResponse> myNotifications(@AuthenticationPrincipal User user) {
        return notificationService.myNotifications(user);
    }

    @GetMapping("/me/unread-count")
    @PreAuthorize("hasAnyRole('STUDENT','STAFF_MEMBER','ADMIN','TECHNICIAN')")
    public Map<String, Long> myUnreadCount(@AuthenticationPrincipal User user) {
        return Map.of("count", notificationService.myUnreadCount(user));
    }

    @PatchMapping("/me/{notificationId}/read")
    @PreAuthorize("hasAnyRole('STUDENT','STAFF_MEMBER','ADMIN','TECHNICIAN')")
    public NotificationResponse markAsRead(
            @AuthenticationPrincipal User user,
            @PathVariable String notificationId) {
        return notificationService.markAsRead(user, notificationId);
    }

    @DeleteMapping("/me/{notificationId}")
    @PreAuthorize("hasAnyRole('STUDENT','STAFF_MEMBER','ADMIN','TECHNICIAN')")
    public MessageResponse deleteNotification(
            @AuthenticationPrincipal User user,
            @PathVariable String notificationId) {
        return notificationService.deleteNotification(user, notificationId);
    }

    @DeleteMapping("/me")
    @PreAuthorize("hasAnyRole('STUDENT','STAFF_MEMBER','ADMIN','TECHNICIAN')")
    public MessageResponse clearMyNotifications(@AuthenticationPrincipal User user) {
        return notificationService.clearAll(user);
    }
}
