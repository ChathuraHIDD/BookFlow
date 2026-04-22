package com.bookflow.backend.notifications.dto;

public record NotificationResponse(
        String id,
        String title,
        String message,
        String createdAt,
        String category,
        String actionUrl,
        boolean read) {
}
