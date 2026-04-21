package com.bookflow.backend.resources.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bookflow.backend.resources.dto.ResourceBookingResponse;
import com.bookflow.backend.resources.dto.UpdateResourceBookingStatusRequest;
import com.bookflow.backend.resources.model.ResourceBookingStatus;
import com.bookflow.backend.resources.service.ResourceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/resources")
@Validated
@PreAuthorize("hasRole('ADMIN')")
public class AdminResourceController {

    private final ResourceService resourceService;

    public AdminResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @PatchMapping("/bookings/{bookingId}/status")
    public ResourceBookingResponse updateBookingStatus(
            @PathVariable String bookingId,
            @Valid @RequestBody UpdateResourceBookingStatusRequest request) {
        ResourceBookingStatus status = ResourceBookingStatus.valueOf(request.getStatus().toUpperCase());
        return resourceService.updateBookingStatus(bookingId, status);
    }
}
