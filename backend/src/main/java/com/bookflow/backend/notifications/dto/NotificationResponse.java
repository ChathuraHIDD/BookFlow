package com.bookflow.backend.notifications.dto;

public record NotificationResponse(
        String id,
        String title,
        String message,
        String createdAt) {
}
