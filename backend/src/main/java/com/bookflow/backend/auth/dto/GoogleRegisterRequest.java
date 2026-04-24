package com.bookflow.backend.auth.dto;

public record GoogleRegisterRequest(
        String idToken,
        String role,
        String telephone,
        String campusYear,
        Integer semester,
        String center,
        String degreeProgram) {
}
