package com.bookflow.backend.facilities.model;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "facility_bookings")
public class FacilityBooking {

    @Id
    private String id;

    @Indexed
    private String buildingId;

    @Indexed
    private String classroomId;

    @Indexed
    private String userId;

    private String buildingName;

    private int floorNumber;

    private String roomNumber;

    private LocalDate bookingDate;

    private LocalTime startTime;

    private LocalTime endTime;

    private String requestedByName;

    private String purpose;

    private String priority;

    private BookingStatus status = BookingStatus.PENDING;

    private List<Integer> selectedSeats = new ArrayList<>();

    private boolean reviewRequired;

    private String decisionNote;

    private Instant createdAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getBuildingId() {
        return buildingId;
    }

    public void setBuildingId(String buildingId) {
        this.buildingId = buildingId;
    }

    public String getClassroomId() {
        return classroomId;
    }

    public void setClassroomId(String classroomId) {
        this.classroomId = classroomId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getBuildingName() {
        return buildingName;
    }

    public void setBuildingName(String buildingName) {
        this.buildingName = buildingName;
    }

    public int getFloorNumber() {
        return floorNumber;
    }

    public void setFloorNumber(int floorNumber) {
        this.floorNumber = floorNumber;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public LocalDate getBookingDate() {
        return bookingDate;
    }

    public void setBookingDate(LocalDate bookingDate) {
        this.bookingDate = bookingDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public String getRequestedByName() {
        return requestedByName;
    }

    public void setRequestedByName(String requestedByName) {
        this.requestedByName = requestedByName;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public List<Integer> getSelectedSeats() {
        return selectedSeats;
    }

    public void setSelectedSeats(List<Integer> selectedSeats) {
        this.selectedSeats = selectedSeats;
    }

    public boolean isReviewRequired() {
        return reviewRequired;
    }

    public void setReviewRequired(boolean reviewRequired) {
        this.reviewRequired = reviewRequired;
    }

    public String getDecisionNote() {
        return decisionNote;
    }

    public void setDecisionNote(String decisionNote) {
        this.decisionNote = decisionNote;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
