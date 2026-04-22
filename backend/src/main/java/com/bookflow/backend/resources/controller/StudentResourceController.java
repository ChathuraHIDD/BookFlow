package com.bookflow.backend.resources.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.resources.dto.CreateResourceBookingRequest;
import com.bookflow.backend.resources.dto.ResourceBookingResponse;
import com.bookflow.backend.resources.dto.ResourceResponse;
import com.bookflow.backend.resources.service.ResourceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/student/resources")
@Validated
public class StudentResourceController {

    private final ResourceService resourceService;

    public StudentResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT','STAFF_MEMBER','ADMIN')")
    public List<ResourceResponse> getAllResources() {
        return resourceService.getAllResources();
    }

    @GetMapping("/categories/{category}")
    @PreAuthorize("hasAnyRole('STUDENT','STAFF_MEMBER','ADMIN')")
    public List<ResourceResponse> getResourcesByCategory(@PathVariable String category) {
        return resourceService.getResourcesByCategory(category);
    }

    @GetMapping("/{slug}")
    @PreAuthorize("hasAnyRole('STUDENT','STAFF_MEMBER','ADMIN')")
    public ResourceResponse getResourceBySlug(@PathVariable String slug) {
        return resourceService.getResourceBySlug(slug);
    }

    @PostMapping("/bookings")
    @PreAuthorize("hasAnyRole('STUDENT','STAFF_MEMBER')")
    public ResourceBookingResponse createBooking(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateResourceBookingRequest request) {
        requireAuthenticatedUser(user);
        return resourceService.createBooking(user, request);
    }

    @GetMapping("/bookings")
    @PreAuthorize("hasAnyRole('STUDENT','STAFF_MEMBER')")
    public List<ResourceBookingResponse> myBookings(@AuthenticationPrincipal User user) {
        requireAuthenticatedUser(user);
        return resourceService.getUserBookings(user.getId());
    }

    private void requireAuthenticatedUser(User user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
    }
}
