package com.bookflow.backend.resources.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.resources.dto.CreateResourceBookingRequest;
import com.bookflow.backend.resources.dto.ResourceBookingResponse;
import com.bookflow.backend.resources.dto.ResourceResponse;
import com.bookflow.backend.resources.service.ResourceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/student/resources")
@Validated
@PreAuthorize("hasAnyRole('STUDENT','STAFF_MEMBER')")
public class StudentResourceController {

    private final ResourceService resourceService;

    public StudentResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @GetMapping
    public List<ResourceResponse> getAllResources() {
        return resourceService.getAllResources();
    }

    @GetMapping("/categories/{category}")
    public List<ResourceResponse> getResourcesByCategory(@PathVariable String category) {
        return resourceService.getResourcesByCategory(category);
    }

    @GetMapping("/{slug}")
    public ResourceResponse getResourceBySlug(@PathVariable String slug) {
        return resourceService.getResourceBySlug(slug);
    }

    @PostMapping("/bookings")
    public ResourceBookingResponse createBooking(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateResourceBookingRequest request) {
        return resourceService.createBooking(user, request);
    }

    @GetMapping("/bookings")
    public List<ResourceBookingResponse> myBookings(@AuthenticationPrincipal User user) {
        return resourceService.getUserBookings(user.getId());
    }
}
