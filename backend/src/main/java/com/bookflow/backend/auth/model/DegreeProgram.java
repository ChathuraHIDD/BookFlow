package com.bookflow.backend.auth.model;

public enum DegreeProgram {
    IT,
    EN,
    ART,
    BS,
    LAW;

    public static DegreeProgram fromValue(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            throw new IllegalArgumentException("Degree program is required");
        }

        return DegreeProgram.valueOf(rawValue.trim().toUpperCase());
    }
}
