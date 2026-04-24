package com.bookflow.backend.support.dto;

public record CreateSupportTicketRequest(
        String title,
        String category,
        String locationResource,
        String description,
        String priority,
        String contactDetails) {
}