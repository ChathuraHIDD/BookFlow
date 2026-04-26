package com.bookflow.backend.profile.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.profile.dto.ProfileUpdateRequestResponse;
import com.bookflow.backend.profile.dto.ProfileUpdateReviewRequest;
import com.bookflow.backend.profile.service.ProfileUpdateService;

@RestController
@RequestMapping("/api/admin/profile-requests")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProfileUpdateController {

    private final ProfileUpdateService profileUpdateService;

    public AdminProfileUpdateController(ProfileUpdateService profileUpdateService) {
        this.profileUpdateService = profileUpdateService;
    }

    @GetMapping
    public List<ProfileUpdateRequestResponse> pendingRequests() {
        return profileUpdateService.pendingRequests();
    }

    @PostMapping("/{id}/approve")
    public ProfileUpdateRequestResponse approve(
            @PathVariable("id") String id,
            @AuthenticationPrincipal User adminUser,
            @RequestBody(required = false) ProfileUpdateReviewRequest reviewRequest) {
        return profileUpdateService.approve(id, adminUser, reviewRequest);
    }

    @PostMapping("/{id}/decline")
    public ProfileUpdateRequestResponse decline(
            @PathVariable("id") String id,
            @AuthenticationPrincipal User adminUser,
            @RequestBody(required = false) ProfileUpdateReviewRequest reviewRequest) {
        return profileUpdateService.decline(id, adminUser, reviewRequest);
    }
}