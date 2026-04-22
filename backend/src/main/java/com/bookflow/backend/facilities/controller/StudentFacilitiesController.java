package com.bookflow.backend.facilities.controller;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.http.HttpStatus;
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
import org.springframework.web.server.ResponseStatusException;

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
        requireAuthenticatedUser(user);
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
            @RequestParam(name = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(name = "startTime", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam(name = "endTime", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime) {
        return facilitiesService.classroomsForFloor(buildingId, floorNumber, date, startTime, endTime);
    }

    @PostMapping("/bookings")
    public BookingResponse createBooking(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateBookingRequest request) {
        requireAuthenticatedUser(user);
        return facilitiesService.createBooking(user, request);
    }

    @GetMapping("/bookings")
    public List<BookingResponse> myBookings(@AuthenticationPrincipal User user) {
        requireAuthenticatedUser(user);
        return facilitiesService.studentBookings(user);
    }

    private void requireAuthenticatedUser(User user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
    }
}
