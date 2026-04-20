package com.bookflow.backend.facilities.dto;

public record BookingResponse(
        String id,
        String buildingName,
        int floorNumber,
        String roomNumber,
        String bookingDate,
        String startTime,
        String endTime,
        String status,
        String requestedByName) {
}
