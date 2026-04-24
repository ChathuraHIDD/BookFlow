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
        String assignedTechnicianId,
        String assignedTechnicianName,
        String resolutionNote,
        String userName,
        String userEmail,
        String createdAt,
        String updatedAt,
        String firstResponseAt,
        String resolvedAt,
        String finalizedAt,
        Long timeToFirstResponseSeconds,
        Long timeToResolutionSeconds,
        java.util.List<SupportTicketCommentResponse> comments,
        java.util.List<SupportTicketAttachmentResponse> attachments) {
}
