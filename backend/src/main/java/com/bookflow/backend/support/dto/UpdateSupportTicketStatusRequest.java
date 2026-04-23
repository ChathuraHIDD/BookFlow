package com.bookflow.backend.support.dto;

public record UpdateSupportTicketStatusRequest(
        String status,
        String adminNote) {
}