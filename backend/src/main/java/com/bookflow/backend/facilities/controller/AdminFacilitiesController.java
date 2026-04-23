package com.bookflow.backend.facilities.controller;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.bookings.audit.dto.BookingAuditEventResponse;
import com.bookflow.backend.facilities.dto.BookingResponse;
import com.bookflow.backend.facilities.dto.BuildingSummaryResponse;
import com.bookflow.backend.facilities.dto.ClassroomResponse;
import com.bookflow.backend.facilities.dto.CreateBuildingRequest;
import com.bookflow.backend.facilities.dto.CreateClassroomRequest;
import com.bookflow.backend.facilities.dto.FacilityReportResponse;
import com.bookflow.backend.facilities.dto.UpdateBookingStatusRequest;
import com.bookflow.backend.facilities.dto.UpdateBuildingFloorsRequest;
import com.bookflow.backend.facilities.dto.UpdateClassroomRequest;
import com.bookflow.backend.facilities.service.FacilitiesService;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/admin/facilities")
@Validated
@PreAuthorize("hasRole('ADMIN')")
public class AdminFacilitiesController {

    private final FacilitiesService facilitiesService;

    public AdminFacilitiesController(FacilitiesService facilitiesService) {
        this.facilitiesService = facilitiesService;
    }

    @GetMapping("/buildings")
    public List<BuildingSummaryResponse> buildings() {
        return facilitiesService.buildingSummaries();
    }

    @PostMapping("/buildings")
    public BuildingSummaryResponse createBuilding(@Valid @RequestBody CreateBuildingRequest request) {
        return facilitiesService.createBuilding(request);
    }

    @PatchMapping("/buildings/{buildingId}/floors")
    public BuildingSummaryResponse updateBuildingFloors(
            @PathVariable String buildingId,
            @Valid @RequestBody UpdateBuildingFloorsRequest request) {
        return facilitiesService.updateBuildingFloors(buildingId, request);
    }

    @PostMapping("/buildings/{buildingId}/floors/{floorNumber}/classrooms")
    public ClassroomResponse createClassroom(
            @PathVariable String buildingId,
            @PathVariable int floorNumber,
            @Valid @RequestBody CreateClassroomRequest request) {
        return facilitiesService.addClassroom(buildingId, floorNumber, request);
    }

    @GetMapping("/buildings/{buildingId}/floors/{floorNumber}/classrooms")
    public List<ClassroomResponse> classrooms(
            @PathVariable String buildingId,
            @PathVariable int floorNumber) {
        return facilitiesService.classroomsForFloor(buildingId, floorNumber, null, null, null);
    }

    @PutMapping("/classrooms/{classroomId}")
    public ClassroomResponse updateClassroom(
            @PathVariable String classroomId,
            @Valid @RequestBody UpdateClassroomRequest request) {
        return facilitiesService.updateClassroom(classroomId, request);
    }

    @PatchMapping("/classrooms/{classroomId}/status/{status}")
    public ClassroomResponse updateClassroomStatus(@PathVariable String classroomId, @PathVariable String status) {
        return facilitiesService.updateClassroomStatus(classroomId, status);
    }

    @DeleteMapping("/classrooms/{classroomId}")
    public void deleteClassroom(@PathVariable String classroomId) {
        facilitiesService.deleteClassroom(classroomId);
    }

    @GetMapping("/bookings")
    public List<BookingResponse> bookings() {
        return facilitiesService.allBookings();
    }

    @PatchMapping("/bookings/{bookingId}")
    public BookingResponse updateBookingStatus(
            @PathVariable String bookingId,
            @Valid @RequestBody UpdateBookingStatusRequest request,
            @AuthenticationPrincipal User actor,
            HttpServletRequest httpRequest) {
        return facilitiesService.updateBookingStatus(
                bookingId,
                request,
                actor,
                clientIp(httpRequest),
                httpRequest.getHeader("User-Agent"),
                httpRequest.getRequestedSessionId());
    }

    @GetMapping("/bookings/{bookingId}/audit")
    public List<BookingAuditEventResponse> bookingAuditTimeline(@PathVariable String bookingId) {
        return facilitiesService.bookingAuditTimeline(bookingId);
    }

    @GetMapping("/reports")
    public FacilityReportResponse reports() {
        return facilitiesService.reports();
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
