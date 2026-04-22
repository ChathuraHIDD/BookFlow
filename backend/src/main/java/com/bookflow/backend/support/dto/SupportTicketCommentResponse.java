package com.bookflow.backend.support.dto;

public record SupportTicketCommentResponse(
        String id,
        String message,
        String authorUserId,
        String authorName,
        String authorRole,
        String createdAt,
        String updatedAt) {
}
