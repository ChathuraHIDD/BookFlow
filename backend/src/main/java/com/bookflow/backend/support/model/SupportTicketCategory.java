package com.bookflow.backend.support.model;

public enum SupportTicketCategory {
    TECHNICAL("Technical"),
    NETWORK("Network"),
    SOFTWARE("Software"),
    HARDWARE("Hardware"),
    BORROWING("Borrowing"),
    LIBRARY("Library"),
    ACCOUNT("Account"),
    BILLING("Billing"),
    FACILITIES("Facilities"),
    ACCESS_CARD("Access Card"),
    OTHER("Other");

    private final String displayName;

    SupportTicketCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static SupportTicketCategory fromValue(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            throw new IllegalArgumentException("Category is required");
        }

        String normalized = rawValue.trim().toUpperCase().replace(' ', '_').replace('-', '_');
        return SupportTicketCategory.valueOf(normalized);
    }
}