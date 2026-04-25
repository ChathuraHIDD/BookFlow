package com.bookflow.backend.bookings.audit.dto;

public record BookingAuditEventResponse(
        String id,
        String bookingId,
        String bookingType,
        String action,
        String previousStatus,
        String newStatus,
        String actorId,
        String actorName,
        String actorRole,
        String reason,
        String timestamp,
        String ipAddress,
        String userAgent,
        String sessionId) {
}
