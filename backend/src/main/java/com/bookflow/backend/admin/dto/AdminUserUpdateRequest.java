package com.bookflow.backend.admin.dto;

public record AdminUserUpdateRequest(
        String fullName,
        String email,
        String role,
        String telephone,
        String campusYear,
        Integer semester,
        String center,
        String degreeProgram) {
}
