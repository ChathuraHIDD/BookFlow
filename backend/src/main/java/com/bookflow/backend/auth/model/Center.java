package com.bookflow.backend.auth.model;

public enum Center {
    COLOMBO_CENTER,
    MATHARA_CENTER,
    JAFFNA_CENTER;

    public static Center fromValue(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            throw new IllegalArgumentException("Center is required");
        }

        String normalized = rawValue.trim().toUpperCase().replace(' ', '_').replace('-', '_');
        if ("MATARA_CENTER".equals(normalized)) {
            normalized = "MATHARA_CENTER";
        }
        return Center.valueOf(normalized);
    }
}
