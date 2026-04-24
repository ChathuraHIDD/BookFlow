package com.bookflow.backend.support.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.support.dto.AddSupportTicketCommentRequest;
import com.bookflow.backend.support.dto.AssignSupportTechnicianRequest;
import com.bookflow.backend.support.dto.CreateSupportTicketRequest;
import com.bookflow.backend.support.dto.SupportTicketResponse;
import com.bookflow.backend.support.dto.TechnicianUpdateSupportTicketRequest;
import com.bookflow.backend.support.dto.UpdateSupportTicketStatusRequest;
import com.bookflow.backend.support.service.SupportTicketService;

@RestController
@RequestMapping("/api/support")
public class SupportTicketController {

    private final SupportTicketService supportTicketService;

    public SupportTicketController(SupportTicketService supportTicketService) {
        this.supportTicketService = supportTicketService;
    }

    @PostMapping(value = "/me", consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('STUDENT')")
    public SupportTicketResponse createMyTicket(
            @AuthenticationPrincipal User user,
            @RequestBody CreateSupportTicketRequest request) {
        return supportTicketService.createTicket(user, request);
    }

    @PostMapping(value = "/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('STUDENT')")
    public SupportTicketResponse createMyTicketWithAttachments(
            @AuthenticationPrincipal User user,
            @RequestPart("payload") CreateSupportTicketRequest request,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments) {
        return supportTicketService.createTicket(user, request, attachments);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public List<SupportTicketResponse> myTickets(@AuthenticationPrincipal User user) {
        return supportTicketService.myTickets(user);
    }

    @GetMapping("/me/{ticketId}")
    @PreAuthorize("hasRole('STUDENT')")
    public SupportTicketResponse myTicket(
            @AuthenticationPrincipal User user,
            @PathVariable String ticketId) {
        return supportTicketService.myTicket(user, ticketId);
    }

    @PostMapping("/me/{ticketId}/comments")
    @PreAuthorize("hasRole('STUDENT')")
    public SupportTicketResponse addMyComment(
            @AuthenticationPrincipal User user,
            @PathVariable String ticketId,
            @RequestBody AddSupportTicketCommentRequest request) {
        return supportTicketService.addComment(user, ticketId, request);
    }

    @PostMapping("/{ticketId}/comments")
    @PreAuthorize("hasAnyRole('STUDENT','STAFF_MEMBER','ADMIN','TECHNICIAN')")
    public SupportTicketResponse addComment(
            @AuthenticationPrincipal User user,
            @PathVariable String ticketId,
            @RequestBody AddSupportTicketCommentRequest request) {
        return supportTicketService.addComment(user, ticketId, request);
    }

    @PatchMapping("/{ticketId}/comments/{commentId}")
    @PreAuthorize("hasAnyRole('STUDENT','STAFF_MEMBER','ADMIN','TECHNICIAN')")
    public SupportTicketResponse updateComment(
            @AuthenticationPrincipal User user,
            @PathVariable String ticketId,
            @PathVariable String commentId,
            @RequestBody AddSupportTicketCommentRequest request) {
        return supportTicketService.updateComment(user, ticketId, commentId, request);
    }

    @DeleteMapping("/{ticketId}/comments/{commentId}")
    @PreAuthorize("hasAnyRole('STUDENT','STAFF_MEMBER','ADMIN','TECHNICIAN')")
    public SupportTicketResponse deleteComment(
            @AuthenticationPrincipal User user,
            @PathVariable String ticketId,
            @PathVariable String commentId) {
        return supportTicketService.deleteComment(user, ticketId, commentId);
    }

    @PostMapping(value = "/me/{ticketId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    public SupportTicketResponse addMyAttachment(
            @AuthenticationPrincipal User user,
            @PathVariable String ticketId,
            @RequestPart("file") MultipartFile file) {
        return supportTicketService.addAttachment(user, ticketId, file);
    }

    @GetMapping("/technician/me")
    @PreAuthorize("hasAnyRole('TECHNICIAN','STAFF_MEMBER')")
    public List<SupportTicketResponse> technicianTickets(@AuthenticationPrincipal User technician) {
        return supportTicketService.technicianTickets(technician);
    }

    @GetMapping("/technician/me/{ticketId}")
    @PreAuthorize("hasAnyRole('TECHNICIAN','STAFF_MEMBER')")
    public SupportTicketResponse technicianTicket(
            @AuthenticationPrincipal User technician,
            @PathVariable String ticketId) {
        return supportTicketService.technicianTicket(technician, ticketId);
    }

    @PatchMapping("/technician/me/{ticketId}")
    @PreAuthorize("hasAnyRole('TECHNICIAN','STAFF_MEMBER')")
    public SupportTicketResponse technicianUpdateTicket(
            @AuthenticationPrincipal User technician,
            @PathVariable String ticketId,
            @RequestBody TechnicianUpdateSupportTicketRequest request) {
        return supportTicketService.technicianUpdateTicket(technician, ticketId, request);
    }

    @GetMapping({"/admin", "/admin/"})
    @PreAuthorize("hasRole('ADMIN')")
    public List<SupportTicketResponse> allTickets() {
        return supportTicketService.allTickets();
    }

    @GetMapping("/admin/{ticketId}")
    @PreAuthorize("hasRole('ADMIN')")
    public SupportTicketResponse adminTicket(@PathVariable String ticketId) {
        return supportTicketService.adminTicket(ticketId);
    }

    @PatchMapping("/admin/{ticketId}")
    @PreAuthorize("hasRole('ADMIN')")
    public SupportTicketResponse updateTicketStatus(
            @PathVariable String ticketId,
            @RequestBody UpdateSupportTicketStatusRequest request) {
        return supportTicketService.updateStatus(ticketId, request);
    }

    @PatchMapping("/admin/{ticketId}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public SupportTicketResponse assignTechnician(
            @PathVariable String ticketId,
            @RequestBody AssignSupportTechnicianRequest request) {
        return supportTicketService.assignTechnician(ticketId, request);
    }

    @PatchMapping("/admin/{ticketId}/decision")
    @PreAuthorize("hasRole('ADMIN')")
    public SupportTicketResponse adminDecision(
            @PathVariable String ticketId,
            @RequestBody UpdateSupportTicketStatusRequest request) {
        return supportTicketService.updateStatus(ticketId, request);
    }

    @GetMapping("/attachments/{ticketId}/{attachmentId}")
    @PreAuthorize("hasAnyRole('STUDENT','STAFF_MEMBER','TECHNICIAN','ADMIN')")
    public org.springframework.http.ResponseEntity<org.springframework.core.io.Resource> downloadAttachment(
            @AuthenticationPrincipal User user,
            @PathVariable String ticketId,
            @PathVariable String attachmentId) {
        return supportTicketService.downloadAttachment(user, ticketId, attachmentId);
    }
}
