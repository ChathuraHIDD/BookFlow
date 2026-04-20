package com.bookflow.backend.profile.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.bookflow.backend.auth.model.CampusYear;
import com.bookflow.backend.auth.model.Center;
import com.bookflow.backend.auth.model.DegreeProgram;

@Document(collection = "profile_update_requests")
public class ProfileUpdateRequest {

    @Id
    private String id;

    private String userId;
    private String fullName;
    private String email;
    private String telephone;
    private CampusYear campusYear;
    private Integer semester;
    private Center center;
    private DegreeProgram degreeProgram;
    private ProfileUpdateStatus status;
    private String adminNote;
    private String reviewedBy;
    private Instant requestedAt;
    private Instant reviewedAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelephone() {
        return telephone;
    }

    public void setTelephone(String telephone) {
        this.telephone = telephone;
    }

    public CampusYear getCampusYear() {
        return campusYear;
    }

    public void setCampusYear(CampusYear campusYear) {
        this.campusYear = campusYear;
    }

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }

    public Center getCenter() {
        return center;
    }

    public void setCenter(Center center) {
        this.center = center;
    }

    public DegreeProgram getDegreeProgram() {
        return degreeProgram;
    }

    public void setDegreeProgram(DegreeProgram degreeProgram) {
        this.degreeProgram = degreeProgram;
    }

    public ProfileUpdateStatus getStatus() {
        return status;
    }

    public void setStatus(ProfileUpdateStatus status) {
        this.status = status;
    }

    public String getAdminNote() {
        return adminNote;
    }

    public void setAdminNote(String adminNote) {
        this.adminNote = adminNote;
    }

    public String getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(String reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public Instant getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(Instant requestedAt) {
        this.requestedAt = requestedAt;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
    }
}
