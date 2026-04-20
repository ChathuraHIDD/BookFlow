package com.bookflow.backend.profile.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bookflow.backend.auth.dto.UserResponse;
import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.profile.dto.ProfileUpdateRequestCreateRequest;
import com.bookflow.backend.profile.dto.ProfileUpdateRequestResponse;
import com.bookflow.backend.profile.service.ProfileUpdateService;

@RestController
@RequestMapping("/api/student/profile")
@PreAuthorize("hasRole('STUDENT')")
public class StudentProfileController {

    private final ProfileUpdateService profileUpdateService;

    public StudentProfileController(ProfileUpdateService profileUpdateService) {
        this.profileUpdateService = profileUpdateService;
    }

    @GetMapping
    public UserResponse currentProfile(@AuthenticationPrincipal User user) {
        return profileUpdateService.currentProfile(user);
    }

    @GetMapping("/requests")
    public List<ProfileUpdateRequestResponse> myRequests(@AuthenticationPrincipal User user) {
        return profileUpdateService.myRequests(user);
    }

    @PostMapping("/requests")
    public ProfileUpdateRequestResponse submitRequest(
            @AuthenticationPrincipal User user,
            @RequestBody ProfileUpdateRequestCreateRequest request) {
        return profileUpdateService.submitRequest(user, request);
    }
}
