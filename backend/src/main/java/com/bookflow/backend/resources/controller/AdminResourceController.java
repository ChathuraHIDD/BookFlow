package com.bookflow.backend.resources.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.bookings.audit.dto.BookingAuditEventResponse;
import com.bookflow.backend.resources.dto.ResourceBookingResponse;
import com.bookflow.backend.resources.dto.UpdateResourceBookingStatusRequest;
import com.bookflow.backend.resources.model.ResourceBookingStatus;
import com.bookflow.backend.resources.service.ResourceService;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/admin/resources")
@Validated
@PreAuthorize("hasRole('ADMIN')")
public class AdminResourceController {

    private final ResourceService resourceService;

    public AdminResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @GetMapping("/bookings")
    public java.util.List<ResourceBookingResponse> getAllBookings() {
        return resourceService.getAllBookings();
    }

    @PatchMapping("/bookings/{bookingId}/status")
    public ResourceBookingResponse updateBookingStatus(
            @PathVariable String bookingId,
            @Valid @RequestBody UpdateResourceBookingStatusRequest request,
            @AuthenticationPrincipal User actor,
            HttpServletRequest httpRequest) {
        ResourceBookingStatus status = ResourceBookingStatus.valueOf(request.getStatus().toUpperCase());
        return resourceService.updateBookingStatus(
                bookingId,
                status,
                request.getReason(),
                actor,
                clientIp(httpRequest),
                httpRequest.getHeader("User-Agent"),
                httpRequest.getRequestedSessionId());
    }

    @GetMapping("/bookings/{bookingId}/audit")
    public java.util.List<BookingAuditEventResponse> bookingAuditTimeline(@PathVariable String bookingId) {
        return resourceService.bookingAuditTimeline(bookingId);
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
