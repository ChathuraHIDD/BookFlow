package com.bookflow.backend.notifications.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    @PreAuthorize("hasAnyRole('STUDENT','STAFF_MEMBER','ADMIN')")
    public List<NotificationResponse> myNotifications(@AuthenticationPrincipal User user) {
        return notificationService.myNotifications(user);
    }
}
