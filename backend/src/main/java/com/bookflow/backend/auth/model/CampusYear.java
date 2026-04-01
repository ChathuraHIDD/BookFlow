package com.bookflow.backend.auth.model;

public enum CampusYear {
    FIRST,
    SECOND,
    THIRD,
    FOURTH;

    public static CampusYear fromValue(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            throw new IllegalArgumentException("Campus year is required");
        }

        return switch (rawValue.trim().toLowerCase()) {
            case "1", "1st", "first", "year1" -> FIRST;
            case "2", "2nd", "second", "year2" -> SECOND;
            case "3", "3rd", "third", "year3" -> THIRD;
            case "4", "4th", "fourth", "year4" -> FOURTH;
            default -> throw new IllegalArgumentException("Invalid campus year: " + rawValue);
        };
    }
}
