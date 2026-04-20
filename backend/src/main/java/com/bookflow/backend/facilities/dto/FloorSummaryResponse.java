package com.bookflow.backend.facilities.dto;

public record FloorSummaryResponse(
        int floorNumber,
        String label,
        long classroomCount) {
}
