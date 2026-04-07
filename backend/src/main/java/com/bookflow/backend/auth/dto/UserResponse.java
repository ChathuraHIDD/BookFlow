package com.bookflow.backend.auth.dto;

import com.bookflow.backend.auth.model.User;

public record UserResponse(
        String id,
        String fullName,
        String email,
        String role,
        String telephone,
        String campusYear,
        Integer semester,
        String center,
        String degreeProgram) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getTelephone(),
                user.getCampusYear() == null ? null : user.getCampusYear().name(),
                user.getSemester(),
                user.getCenter() == null ? null : user.getCenter().name(),
                user.getDegreeProgram() == null ? null : user.getDegreeProgram().name());
    }
}
