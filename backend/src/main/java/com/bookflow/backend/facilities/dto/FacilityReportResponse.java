package com.bookflow.backend.facilities.dto;

public record FacilityReportResponse(
        long totalBuildings,
        long totalClassrooms,
        long totalBookings,
        long pendingBookings,
        long unavailableClassrooms) {
}
