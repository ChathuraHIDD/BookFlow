package com.bookflow.backend.profile.dto;

import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.profile.model.ProfileUpdateRequest;
import com.bookflow.backend.profile.model.ProfileUpdateStatus;

public record ProfileUpdateRequestResponse(
        String id,
        String userId,
        String userFullName,
        String userEmail,
        String fullName,
        String email,
        String telephone,
        String campusYear,
        Integer semester,
        String center,
        String degreeProgram,
        ProfileUpdateStatus status,
        String adminNote,
        String reviewedBy,
        String requestedAt,
        String reviewedAt) {

    public static ProfileUpdateRequestResponse from(ProfileUpdateRequest request, User user) {
        return new ProfileUpdateRequestResponse(
                request.getId(),
                request.getUserId(),
                user != null ? user.getFullName() : null,
                user != null ? user.getEmail() : null,
                request.getFullName(),
                request.getEmail(),
                request.getTelephone(),
                request.getCampusYear() != null ? request.getCampusYear().name() : null,
                request.getSemester(),
                request.getCenter() != null ? request.getCenter().name() : null,
                request.getDegreeProgram() != null ? request.getDegreeProgram().name() : null,
                request.getStatus(),
                request.getAdminNote(),
                request.getReviewedBy(),
                request.getRequestedAt() != null ? request.getRequestedAt().toString() : null,
                request.getReviewedAt() != null ? request.getReviewedAt().toString() : null);
    }
}
