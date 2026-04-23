package com.bookflow.backend.support.model;

public enum SupportTicketStatus {
    OPEN("Open"),
    IN_PROGRESS("In Progress"),
    RESOLVED("Resolved"),
    CLOSED("Closed"),
    REJECTED("Rejected");

    private final String displayName;

    SupportTicketStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static SupportTicketStatus fromValue(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            throw new IllegalArgumentException("Status is required");
        }

        String normalized = rawValue.trim().toUpperCase().replace(' ', '_').replace('-', '_');
        return SupportTicketStatus.valueOf(normalized);
    }
}