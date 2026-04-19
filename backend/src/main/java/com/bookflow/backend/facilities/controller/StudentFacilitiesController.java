package com.bookflow.backend.facilities.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.facilities.dto.BookingResponse;
import com.bookflow.backend.facilities.dto.ClassroomResponse;
import com.bookflow.backend.facilities.dto.CreateBookingRequest;
import com.bookflow.backend.facilities.dto.FloorSummaryResponse;
import com.bookflow.backend.facilities.dto.StudentFacilitiesOverviewResponse;
import com.bookflow.backend.facilities.service.FacilitiesService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/student/facilities")
@Validated
@PreAuthorize("hasAnyRole('STUDENT','STAFF_MEMBER')")
public class StudentFacilitiesController {

    private final FacilitiesService facilitiesService;

    public StudentFacilitiesController(FacilitiesService facilitiesService) {
        this.facilitiesService = facilitiesService;
    }

    @GetMapping
    public StudentFacilitiesOverviewResponse overview(@AuthenticationPrincipal User user) {
        return facilitiesService.studentOverview(user);
    }

    @GetMapping("/buildings/{buildingId}/floors")
    public List<FloorSummaryResponse> floors(@PathVariable String buildingId) {
        return facilitiesService.floorsForBuilding(buildingId);
    }

    @GetMapping("/buildings/{buildingId}/floors/{floorNumber}/classrooms")
    public List<ClassroomResponse> classrooms(
            @PathVariable String buildingId,
            @PathVariable int floorNumber,
            @RequestParam(name = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return facilitiesService.classroomsForFloor(buildingId, floorNumber, date);
    }

    @PostMapping("/bookings")
    public BookingResponse createBooking(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateBookingRequest request) {
        return facilitiesService.createBooking(user, request);
    }

    @GetMapping("/bookings")
    public List<BookingResponse> myBookings(@AuthenticationPrincipal User user) {
        return facilitiesService.studentBookings(user);
    }
}
