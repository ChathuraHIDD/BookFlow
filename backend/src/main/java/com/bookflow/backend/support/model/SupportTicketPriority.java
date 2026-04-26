package com.bookflow.backend.support.model;

public enum SupportTicketPriority {
    LOW("Low"),
    MEDIUM("Medium"),
    HIGH("High");

    private final String displayName;

    SupportTicketPriority(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static SupportTicketPriority fromValue(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            throw new IllegalArgumentException("Priority is required");
        }

        String normalized = rawValue.trim().toUpperCase().replace(' ', '_').replace('-', '_');
        return SupportTicketPriority.valueOf(normalized);
    }
}