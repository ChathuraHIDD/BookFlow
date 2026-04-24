package com.bookflow.backend.support.dto;

public record SupportTicketAttachmentResponse(
        String id,
        String originalFileName,
        String contentType,
        long size,
        String uploadedByName,
        String uploadedByRole,
        String createdAt,
        String downloadUrl) {
}