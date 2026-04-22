package com.bookflow.backend.support.service;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.notifications.service.NotificationService;
import com.bookflow.backend.support.dto.CreateSupportTicketRequest;
import com.bookflow.backend.support.dto.SupportTicketResponse;
import com.bookflow.backend.support.dto.UpdateSupportTicketStatusRequest;
import com.bookflow.backend.support.model.SupportTicket;
import com.bookflow.backend.support.model.SupportTicketCategory;
import com.bookflow.backend.support.model.SupportTicketPriority;
import com.bookflow.backend.support.model.SupportTicketStatus;
import com.bookflow.backend.support.repository.SupportTicketRepository;

@Service
public class SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final NotificationService notificationService;

    public SupportTicketService(SupportTicketRepository supportTicketRepository, NotificationService notificationService) {
        this.supportTicketRepository = supportTicketRepository;
        this.notificationService = notificationService;
    }

    public SupportTicketResponse createTicket(User user, CreateSupportTicketRequest request) {
        String title = requireText(request.title(), "Title");
        String locationResource = requireText(request.locationResource(), "Location / Resource");
        String description = requireText(request.description(), "Description");
        String contactDetails = requireText(request.contactDetails(), "Contact details");

        SupportTicket ticket = new SupportTicket();
        ticket.setTicketNumber(generateTicketNumber());
        ticket.setUserId(user.getId());
        ticket.setUserName(StringUtils.hasText(user.getFullName()) ? user.getFullName().trim() : user.getEmail());
        ticket.setUserEmail(user.getEmail());
        ticket.setTitle(title);
        ticket.setCategory(parseCategory(request.category()));
        ticket.setLocationResource(locationResource);
        ticket.setDescription(description);
        ticket.setPriority(parsePriority(request.priority()));
        ticket.setStatus(SupportTicketStatus.OPEN);
        ticket.setContactDetails(contactDetails);
        ticket.setAdminNote(null);
        ticket.setCreatedAt(Instant.now());
        ticket.setUpdatedAt(ticket.getCreatedAt());
        ticket.setResolvedAt(null);

        SupportTicket saved = supportTicketRepository.save(ticket);
        notificationService.notifyAdmins(
                "New Support Ticket",
                String.format("%s submitted support ticket %s.", saved.getUserName(), saved.getTicketNumber()),
                "TICKET_MANAGEMENT",
                "/admin/tickets");
        return toResponse(saved);
    }

    public List<SupportTicketResponse> myTickets(User user) {
        return supportTicketRepository.findByUserIdOrderByUpdatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public SupportTicketResponse myTicket(User user, String ticketId) {
        return toResponse(getOwnedTicket(user, ticketId));
    }

    public List<SupportTicketResponse> allTickets() {
        return supportTicketRepository.findAllByOrderByUpdatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public SupportTicketResponse adminTicket(String ticketId) {
        return toResponse(getTicket(ticketId));
    }

    public SupportTicketResponse updateStatus(String ticketId, UpdateSupportTicketStatusRequest request) {
        SupportTicket ticket = getTicket(ticketId);
        SupportTicketStatus status = parseStatus(request.status());
        ticket.setStatus(status);
        ticket.setAdminNote(trimToNull(request.adminNote()));
        ticket.setUpdatedAt(Instant.now());
        ticket.setResolvedAt(status == SupportTicketStatus.RESOLVED ? ticket.getUpdatedAt() : null);

        SupportTicket saved = supportTicketRepository.save(ticket);
        notificationService.notifyUser(
                saved.getUserId(),
                "Support Ticket Updated",
                String.format("Your ticket %s is now %s.", saved.getTicketNumber(), saved.getStatus().getDisplayName()),
                "TICKET_MANAGEMENT",
                "/student/support/" + saved.getId());
        return toResponse(saved);
    }

    private SupportTicket getOwnedTicket(User user, String ticketId) {
        SupportTicket ticket = getTicket(ticketId);
        if (!ticket.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Support ticket not found");
        }
        return ticket;
    }

    private SupportTicket getTicket(String ticketId) {
        return supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Support ticket not found"));
    }

    private SupportTicketCategory parseCategory(String rawValue) {
        try {
            return SupportTicketCategory.fromValue(StringUtils.hasText(rawValue) ? rawValue : "TECHNICAL");
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported ticket category");
        }
    }

    private SupportTicketPriority parsePriority(String rawValue) {
        try {
            return SupportTicketPriority.fromValue(StringUtils.hasText(rawValue) ? rawValue : "MEDIUM");
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported ticket priority");
        }
    }

    private SupportTicketStatus parseStatus(String rawValue) {
        try {
            return SupportTicketStatus.fromValue(requireText(rawValue, "Status"));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported ticket status");
        }
    }

    private String generateTicketNumber() {
        return "SUP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
    }

    private String requireText(String value, String fieldName) {
        if (!StringUtils.hasText(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required");
        }
        return value.trim();
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private SupportTicketResponse toResponse(SupportTicket ticket) {
        return new SupportTicketResponse(
                ticket.getId(),
                ticket.getTicketNumber(),
                ticket.getTitle(),
                ticket.getCategory() != null ? ticket.getCategory().getDisplayName() : "",
                ticket.getLocationResource(),
                ticket.getDescription(),
                ticket.getPriority() != null ? ticket.getPriority().getDisplayName() : "",
                ticket.getStatus() != null ? ticket.getStatus().getDisplayName() : "",
                ticket.getContactDetails(),
                ticket.getAdminNote(),
                ticket.getUserName(),
                ticket.getUserEmail(),
                ticket.getCreatedAt() != null ? ticket.getCreatedAt().toString() : "",
                ticket.getUpdatedAt() != null ? ticket.getUpdatedAt().toString() : "",
                ticket.getResolvedAt() != null ? ticket.getResolvedAt().toString() : "");
    }
}