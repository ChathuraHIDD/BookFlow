package com.bookflow.backend.support.dto;

public record SupportTicketResponse(
        String id,
        String ticketNumber,
        String title,
        String category,
        String locationResource,
        String description,
        String priority,
        String status,
        String contactDetails,
        String adminNote,
        String userName,
        String userEmail,
        String createdAt,
        String updatedAt,
        String resolvedAt) {
}