package com.bookflow.backend.facilities.dto;

import java.util.List;

public record StudentFacilitiesOverviewResponse(
        List<BuildingSummaryResponse> buildings,
        List<BookingResponse> myBookings) {
}
