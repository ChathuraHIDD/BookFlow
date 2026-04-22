package com.bookflow.backend.support.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.auth.model.UserRole;
import com.bookflow.backend.auth.repository.UserRepository;
import com.bookflow.backend.notifications.service.NotificationService;
import com.bookflow.backend.support.dto.AddSupportTicketCommentRequest;
import com.bookflow.backend.support.dto.AssignSupportTechnicianRequest;
import com.bookflow.backend.support.dto.CreateSupportTicketRequest;
import com.bookflow.backend.support.dto.SupportTicketAttachmentResponse;
import com.bookflow.backend.support.dto.SupportTicketCommentResponse;
import com.bookflow.backend.support.dto.SupportTicketResponse;
import com.bookflow.backend.support.dto.TechnicianUpdateSupportTicketRequest;
import com.bookflow.backend.support.dto.UpdateSupportTicketStatusRequest;
import com.bookflow.backend.support.model.SupportTicket;
import com.bookflow.backend.support.model.SupportTicketAttachment;
import com.bookflow.backend.support.model.SupportTicketCategory;
import com.bookflow.backend.support.model.SupportTicketComment;
import com.bookflow.backend.support.model.SupportTicketPriority;
import com.bookflow.backend.support.model.SupportTicketStatus;
import com.bookflow.backend.support.repository.SupportTicketRepository;

@Service
public class SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Value("${app.support.attachments-dir:uploads/support-tickets}")
    private String attachmentsDirectory;

    public SupportTicketService(
            SupportTicketRepository supportTicketRepository,
            UserRepository userRepository,
            NotificationService notificationService) {
        this.supportTicketRepository = supportTicketRepository;
        this.userRepository = userRepository;
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
        ticket.setUserName(resolveDisplayName(user));
        ticket.setUserEmail(user.getEmail());
        ticket.setTitle(title);
        ticket.setCategory(parseCategory(request.category()));
        ticket.setLocationResource(locationResource);
        ticket.setDescription(description);
        ticket.setPriority(parsePriority(request.priority()));
        ticket.setStatus(SupportTicketStatus.OPEN);
        ticket.setContactDetails(contactDetails);
        ticket.setAdminNote(null);
        ticket.setAssignedTechnicianId(null);
        ticket.setAssignedTechnicianName(null);
        ticket.setResolutionNote(null);
        ticket.setFinalizedAt(null);
        ticket.setComments(new ArrayList<>());
        ticket.setAttachments(new ArrayList<>());
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

    public SupportTicketResponse addStudentComment(User user, String ticketId, AddSupportTicketCommentRequest request) {
        SupportTicket ticket = getOwnedTicket(user, ticketId);
        String message = requireText(request.message(), "Comment message");
        ensureCollections(ticket);

        SupportTicketComment comment = new SupportTicketComment();
        comment.setId(UUID.randomUUID().toString());
        comment.setMessage(message);
        comment.setAuthorUserId(user.getId());
        comment.setAuthorName(resolveDisplayName(user));
        comment.setAuthorRole(user.getRole() != null ? user.getRole().name() : UserRole.STUDENT.name());
        comment.setCreatedAt(Instant.now());

        ticket.getComments().add(comment);
        ticket.setUpdatedAt(comment.getCreatedAt());

        SupportTicket saved = supportTicketRepository.save(ticket);

        if (StringUtils.hasText(saved.getAssignedTechnicianId())) {
            notificationService.notifyUser(
                    saved.getAssignedTechnicianId(),
                    "Support Ticket Comment",
                    String.format("%s commented on ticket %s.", saved.getUserName(), saved.getTicketNumber()),
                    "TICKET_MANAGEMENT",
                    "/technician/tickets/" + saved.getId());
        } else {
            notificationService.notifyAdmins(
                    "Support Ticket Comment",
                    String.format("%s commented on ticket %s.", saved.getUserName(), saved.getTicketNumber()),
                    "TICKET_MANAGEMENT",
                    "/admin/tickets/" + saved.getId());
        }

        return toResponse(saved);
    }

    public SupportTicketResponse addAttachment(User user, String ticketId, MultipartFile file) {
        SupportTicket ticket = getOwnedTicket(user, ticketId);
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachment file is required");
        }

        ensureCollections(ticket);
        String originalFileName = sanitizeFileName(file.getOriginalFilename());
        String storedFileName = UUID.randomUUID() + "_" + originalFileName;
        String contentType = StringUtils.hasText(file.getContentType()) ? file.getContentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;

        Path ticketDirectory = resolveTicketDirectory(ticket.getId());
        Path storedPath = ticketDirectory.resolve(storedFileName);

        try {
            Files.createDirectories(ticketDirectory);
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, storedPath, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store attachment", ex);
        }

        SupportTicketAttachment attachment = new SupportTicketAttachment();
        attachment.setId(UUID.randomUUID().toString());
        attachment.setOriginalFileName(originalFileName);
        attachment.setStoredFileName(storedFileName);
        attachment.setContentType(contentType);
        attachment.setSize(file.getSize());
        attachment.setUploadedByUserId(user.getId());
        attachment.setUploadedByName(resolveDisplayName(user));
        attachment.setUploadedByRole(user.getRole() != null ? user.getRole().name() : UserRole.STUDENT.name());
        attachment.setCreatedAt(Instant.now());

        ticket.getAttachments().add(attachment);
        ticket.setUpdatedAt(attachment.getCreatedAt());

        SupportTicket saved = supportTicketRepository.save(ticket);
        return toResponse(saved);
    }

    public List<SupportTicketResponse> technicianTickets(User technician) {
        return supportTicketRepository.findByAssignedTechnicianIdOrderByUpdatedAtDesc(technician.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public SupportTicketResponse technicianTicket(User technician, String ticketId) {
        return toResponse(getAssignedTicket(technician, ticketId));
    }

    public SupportTicketResponse technicianUpdateTicket(
            User technician,
            String ticketId,
            TechnicianUpdateSupportTicketRequest request) {
        SupportTicket ticket = getAssignedTicket(technician, ticketId);
        SupportTicketStatus nextStatus = parseStatus(request.status());
        ensureTechnicianTransition(ticket.getStatus(), nextStatus);

        ticket.setStatus(nextStatus);
        ticket.setResolutionNote(trimToNull(request.resolutionNote()));
        ticket.setUpdatedAt(Instant.now());
        if (nextStatus == SupportTicketStatus.RESOLVED) {
            ticket.setResolvedAt(ticket.getUpdatedAt());
            ticket.setFinalizedAt(ticket.getUpdatedAt());
        }

        SupportTicket saved = supportTicketRepository.save(ticket);
        notificationService.notifyUser(
                saved.getUserId(),
                "Support Ticket Updated",
                String.format("Your ticket %s is now %s.", saved.getTicketNumber(), saved.getStatus().getDisplayName()),
                "TICKET_MANAGEMENT",
                "/student/support/" + saved.getId());
        return toResponse(saved);
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

    public SupportTicketResponse assignTechnician(String ticketId, AssignSupportTechnicianRequest request) {
        SupportTicket ticket = getTicket(ticketId);
        if (ticket.getStatus() == SupportTicketStatus.CLOSED || ticket.getStatus() == SupportTicketStatus.REJECTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Closed tickets cannot be reassigned");
        }

        User technician = getTechnician(request.technicianId());
        ticket.setAssignedTechnicianId(technician.getId());
        ticket.setAssignedTechnicianName(resolveDisplayName(technician));
        ticket.setUpdatedAt(Instant.now());

        SupportTicket saved = supportTicketRepository.save(ticket);
        notificationService.notifyUser(
                technician.getId(),
                "Support Ticket Assigned",
                String.format("Ticket %s has been assigned to you.", saved.getTicketNumber()),
                "TICKET_MANAGEMENT",
                "/technician/tickets/" + saved.getId());
        notificationService.notifyUser(
                saved.getUserId(),
                "Support Ticket Assigned",
                String.format("Your ticket %s has been assigned to %s.", saved.getTicketNumber(), saved.getAssignedTechnicianName()),
                "TICKET_MANAGEMENT",
                "/student/support/" + saved.getId());
        return toResponse(saved);
    }

    public SupportTicketResponse updateStatus(String ticketId, UpdateSupportTicketStatusRequest request) {
        SupportTicket ticket = getTicket(ticketId);
        SupportTicketStatus status = parseStatus(request.status());
        ticket.setStatus(status);
        ticket.setAdminNote(trimToNull(request.adminNote()));
        ticket.setUpdatedAt(Instant.now());

        if (status == SupportTicketStatus.RESOLVED) {
            ticket.setResolvedAt(ticket.getUpdatedAt());
            ticket.setFinalizedAt(ticket.getUpdatedAt());
        } else if (status == SupportTicketStatus.CLOSED || status == SupportTicketStatus.REJECTED) {
            ticket.setFinalizedAt(ticket.getUpdatedAt());
        }

        SupportTicket saved = supportTicketRepository.save(ticket);
        notificationService.notifyUser(
                saved.getUserId(),
                "Support Ticket Updated",
                String.format("Your ticket %s is now %s.", saved.getTicketNumber(), saved.getStatus().getDisplayName()),
                "TICKET_MANAGEMENT",
                "/student/support/" + saved.getId());
        return toResponse(saved);
    }

    public ResponseEntity<Resource> downloadAttachment(User user, String ticketId, String attachmentId) {
        SupportTicket ticket = getAccessibleTicket(user, ticketId);
        ensureCollections(ticket);
        SupportTicketAttachment attachment = ticket.getAttachments().stream()
                .filter(item -> attachmentId.equals(item.getId()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"));

        Path storedPath = resolveTicketDirectory(ticket.getId()).resolve(attachment.getStoredFileName());
        if (!Files.exists(storedPath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment file not found");
        }

        Resource resource = new FileSystemResource(storedPath);
        String contentType = StringUtils.hasText(attachment.getContentType())
                ? attachment.getContentType()
                : MediaType.APPLICATION_OCTET_STREAM_VALUE;

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(attachment.getOriginalFileName()).build().toString())
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    private SupportTicket getAccessibleTicket(User user, String ticketId) {
        if (user.getRole() == UserRole.ADMIN) {
            return getTicket(ticketId);
        }
        if (user.getRole() == UserRole.TECHNICIAN) {
            return getAssignedTicket(user, ticketId);
        }
        return getOwnedTicket(user, ticketId);
    }

    private SupportTicket getOwnedTicket(User user, String ticketId) {
        SupportTicket ticket = getTicket(ticketId);
        if (!ticket.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Support ticket not found");
        }
        return ticket;
    }

    private SupportTicket getAssignedTicket(User technician, String ticketId) {
        SupportTicket ticket = getTicket(ticketId);
        if (!StringUtils.hasText(ticket.getAssignedTechnicianId()) || !ticket.getAssignedTechnicianId().equals(technician.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Support ticket not found");
        }
        return ticket;
    }

    private SupportTicket getTicket(String ticketId) {
        return supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Support ticket not found"));
    }

    private User getTechnician(String technicianId) {
        String resolvedTechnicianId = requireText(technicianId, "Technician ID");
        User technician = userRepository.findById(resolvedTechnicianId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Technician not found"));
        if (technician.getRole() != UserRole.TECHNICIAN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected user is not a technician");
        }
        return technician;
    }

    private void ensureTechnicianTransition(SupportTicketStatus currentStatus, SupportTicketStatus nextStatus) {
        if (nextStatus != SupportTicketStatus.IN_PROGRESS && nextStatus != SupportTicketStatus.RESOLVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Technicians can only move tickets to In Progress or Resolved");
        }

        if (currentStatus == SupportTicketStatus.OPEN && nextStatus == SupportTicketStatus.IN_PROGRESS) {
            return;
        }
        if (currentStatus == SupportTicketStatus.OPEN && nextStatus == SupportTicketStatus.RESOLVED) {
            return;
        }
        if (currentStatus == SupportTicketStatus.IN_PROGRESS && nextStatus == SupportTicketStatus.RESOLVED) {
            return;
        }

        throw new ResponseStatusException(HttpStatus.CONFLICT, "Invalid ticket status transition");
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

    private String resolveDisplayName(User user) {
        if (user == null) {
            return "";
        }
        return StringUtils.hasText(user.getFullName()) ? user.getFullName().trim() : user.getEmail();
    }

    private void ensureCollections(SupportTicket ticket) {
        if (ticket.getComments() == null) {
            ticket.setComments(new ArrayList<>());
        }
        if (ticket.getAttachments() == null) {
            ticket.setAttachments(new ArrayList<>());
        }
    }

    private Path resolveTicketDirectory(String ticketId) {
        return Path.of(attachmentsDirectory, ticketId).toAbsolutePath().normalize();
    }

    private String sanitizeFileName(String fileName) {
        if (!StringUtils.hasText(fileName)) {
            return "attachment";
        }

        String sanitized = Path.of(fileName).getFileName().toString();
        return sanitized.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private SupportTicketResponse toResponse(SupportTicket ticket) {
        ensureCollections(ticket);

        List<SupportTicketCommentResponse> commentResponses = ticket.getComments().stream()
                .map(comment -> new SupportTicketCommentResponse(
                        comment.getId(),
                        comment.getMessage(),
                        comment.getAuthorUserId(),
                        comment.getAuthorName(),
                        comment.getAuthorRole(),
                        comment.getCreatedAt() != null ? comment.getCreatedAt().toString() : ""))
                .toList();

        List<SupportTicketAttachmentResponse> attachmentResponses = ticket.getAttachments().stream()
                .map(attachment -> new SupportTicketAttachmentResponse(
                        attachment.getId(),
                        attachment.getOriginalFileName(),
                        attachment.getContentType(),
                        attachment.getSize(),
                        attachment.getUploadedByName(),
                        attachment.getUploadedByRole(),
                        attachment.getCreatedAt() != null ? attachment.getCreatedAt().toString() : "",
                        "/api/support/attachments/" + ticket.getId() + "/" + attachment.getId()))
                .toList();

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
                ticket.getAssignedTechnicianId(),
                ticket.getAssignedTechnicianName(),
                ticket.getResolutionNote(),
                ticket.getUserName(),
                ticket.getUserEmail(),
                ticket.getCreatedAt() != null ? ticket.getCreatedAt().toString() : "",
                ticket.getUpdatedAt() != null ? ticket.getUpdatedAt().toString() : "",
                ticket.getResolvedAt() != null ? ticket.getResolvedAt().toString() : "",
                ticket.getFinalizedAt() != null ? ticket.getFinalizedAt().toString() : "",
                commentResponses,
                attachmentResponses);
    }
}