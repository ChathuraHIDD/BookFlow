package com.bookflow.backend.auth.dto;

public record RegisterRequest(
        String fullName,
        String email,
        String password,
        String role,
        String telephone,
        String campusYear,
        Integer semester,
        String center,
        String degreeProgram) {
}
