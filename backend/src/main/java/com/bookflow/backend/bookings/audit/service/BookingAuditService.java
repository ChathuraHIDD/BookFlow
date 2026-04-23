package com.bookflow.backend.bookings.audit.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.bookings.audit.dto.BookingAuditEventResponse;
import com.bookflow.backend.bookings.audit.model.BookingAuditEvent;
import com.bookflow.backend.bookings.audit.model.BookingAuditType;
import com.bookflow.backend.bookings.audit.repository.BookingAuditEventRepository;

@Service
public class BookingAuditService {

    private final BookingAuditEventRepository auditEventRepository;

    public BookingAuditService(BookingAuditEventRepository auditEventRepository) {
        this.auditEventRepository = auditEventRepository;
    }

    public void recordEvent(
            String bookingId,
            BookingAuditType bookingType,
            String action,
            String previousStatus,
            String newStatus,
            User actor,
            String reason,
            String ipAddress,
            String userAgent,
            String sessionId) {
        BookingAuditEvent event = new BookingAuditEvent();
        event.setBookingId(bookingId);
        event.setBookingType(bookingType);
        event.setAction(action);
        event.setPreviousStatus(previousStatus);
        event.setNewStatus(newStatus);
        event.setActorId(actor != null ? actor.getId() : "SYSTEM");
        event.setActorName(actor != null && StringUtils.hasText(actor.getFullName()) ? actor.getFullName() : "System");
        event.setActorRole(actor != null && actor.getRole() != null ? actor.getRole().name() : "SYSTEM");
        event.setReason(StringUtils.hasText(reason) ? reason.trim() : "No reason provided");
        event.setTimestamp(Instant.now());
        event.setIpAddress(StringUtils.hasText(ipAddress) ? ipAddress : "UNKNOWN");
        event.setUserAgent(StringUtils.hasText(userAgent) ? userAgent : "UNKNOWN");
        event.setSessionId(StringUtils.hasText(sessionId) ? sessionId : "UNKNOWN");
        auditEventRepository.save(event);
    }

    public List<BookingAuditEventResponse> getTimeline(String bookingId, BookingAuditType bookingType) {
        return auditEventRepository.findByBookingIdAndBookingTypeOrderByTimestampAsc(bookingId, bookingType)
                .stream()
                .map(event -> new BookingAuditEventResponse(
                        event.getId(),
                        event.getBookingId(),
                        event.getBookingType() != null ? event.getBookingType().name() : "UNKNOWN",
                        event.getAction(),
                        event.getPreviousStatus(),
                        event.getNewStatus(),
                        event.getActorId(),
                        event.getActorName(),
                        event.getActorRole(),
                        event.getReason(),
                        event.getTimestamp() != null ? event.getTimestamp().toString() : "",
                        event.getIpAddress(),
                        event.getUserAgent(),
                        event.getSessionId()))
                .toList();
    }
}
