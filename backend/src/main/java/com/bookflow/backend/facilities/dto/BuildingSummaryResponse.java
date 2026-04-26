package com.bookflow.backend.facilities.dto;

public record BuildingSummaryResponse(
        String id,
        String name,
        String code,
        int floorCount,
        long classroomCount) {
}
