package com.bookflow.backend.profile.dto;

public record ProfileUpdateRequestCreateRequest(
        String fullName,
        String email,
        String telephone,
        String campusYear,
        Integer semester,
        String center,
        String degreeProgram) {
}
