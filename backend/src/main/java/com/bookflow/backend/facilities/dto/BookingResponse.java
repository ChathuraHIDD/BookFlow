package com.bookflow.backend.facilities.dto;

import java.util.List;

public record BookingResponse(
        String id,
        String buildingId,
        String buildingName,
        String classroomId,
        int floorNumber,
        String roomNumber,
        String userId,
        String bookingDate,
        String startTime,
        String endTime,
        String status,
        String requestedByName,
        List<Integer> selectedSeats,
        String purpose,
        String priority,
        boolean reviewRequired,
        String decisionNote,
        String createdAt) {
}
