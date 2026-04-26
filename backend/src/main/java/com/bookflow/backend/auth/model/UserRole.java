package com.bookflow.backend.auth.model;

public enum UserRole {
    STUDENT,
    LIBRARIAN,
    ADMIN,
    STAFF_MEMBER,
    TECHNICIAN;

    public static UserRole fromValue(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            throw new IllegalArgumentException("Role is required");
        }

        String normalized = rawValue.trim().toUpperCase().replace(' ', '_').replace('-', '_');
        return UserRole.valueOf(normalized);
    }
}
