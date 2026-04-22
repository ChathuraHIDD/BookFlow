package com.bookflow.backend.support.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.support.dto.CreateSupportTicketRequest;
import com.bookflow.backend.support.dto.SupportTicketResponse;
import com.bookflow.backend.support.dto.UpdateSupportTicketStatusRequest;
import com.bookflow.backend.support.service.SupportTicketService;

@RestController
@RequestMapping("/api/support")
public class SupportTicketController {

    private final SupportTicketService supportTicketService;

    public SupportTicketController(SupportTicketService supportTicketService) {
        this.supportTicketService = supportTicketService;
    }

    @PostMapping("/me")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('STUDENT','STAFF_MEMBER','ADMIN')")
    public SupportTicketResponse createMyTicket(
            @AuthenticationPrincipal User user,
            @RequestBody CreateSupportTicketRequest request) {
        return supportTicketService.createTicket(user, request);
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('STUDENT','STAFF_MEMBER','ADMIN')")
    public List<SupportTicketResponse> myTickets(@AuthenticationPrincipal User user) {
        return supportTicketService.myTickets(user);
    }

    @GetMapping("/me/{ticketId}")
    @PreAuthorize("hasAnyRole('STUDENT','STAFF_MEMBER','ADMIN')")
    public SupportTicketResponse myTicket(
            @AuthenticationPrincipal User user,
            @PathVariable String ticketId) {
        return supportTicketService.myTicket(user, ticketId);
    }

    @GetMapping({"/admin", "/admin/"})
    @PreAuthorize("hasAnyRole('ADMIN','STAFF_MEMBER')")
    public List<SupportTicketResponse> allTickets() {
        return supportTicketService.allTickets();
    }

    @GetMapping("/admin/{ticketId}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF_MEMBER')")
    public SupportTicketResponse adminTicket(@PathVariable String ticketId) {
        return supportTicketService.adminTicket(ticketId);
    }

    @PatchMapping("/admin/{ticketId}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF_MEMBER')")
    public SupportTicketResponse updateTicketStatus(
            @PathVariable String ticketId,
            @RequestBody UpdateSupportTicketStatusRequest request) {
        return supportTicketService.updateStatus(ticketId, request);
    }
}