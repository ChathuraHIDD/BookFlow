package com.bookflow.backend.support.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "support_tickets")
public class SupportTicket {

    @Id
    private String id;

    @Indexed(unique = true)
    private String ticketNumber;

    @Indexed
    private String userId;

    private String userName;

    private String userEmail;

    private String title;

    private SupportTicketCategory category;

    private String locationResource;

    private String description;

    private SupportTicketPriority priority;

    private SupportTicketStatus status;

    private String contactDetails;

    private String adminNote;

    private String assignedTechnicianId;

    private String assignedTechnicianName;

    private String resolutionNote;

    private Instant finalizedAt;

    private List<SupportTicketComment> comments = new ArrayList<>();

    private List<SupportTicketAttachment> attachments = new ArrayList<>();

    private Instant createdAt;

    private Instant updatedAt;

    private Instant firstResponseAt;

    private Instant resolvedAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTicketNumber() {
        return ticketNumber;
    }

    public void setTicketNumber(String ticketNumber) {
        this.ticketNumber = ticketNumber;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public SupportTicketCategory getCategory() {
        return category;
    }

    public void setCategory(SupportTicketCategory category) {
        this.category = category;
    }

    public String getLocationResource() {
        return locationResource;
    }

    public void setLocationResource(String locationResource) {
        this.locationResource = locationResource;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public SupportTicketPriority getPriority() {
        return priority;
    }

    public void setPriority(SupportTicketPriority priority) {
        this.priority = priority;
    }

    public SupportTicketStatus getStatus() {
        return status;
    }

    public void setStatus(SupportTicketStatus status) {
        this.status = status;
    }

    public String getContactDetails() {
        return contactDetails;
    }

    public void setContactDetails(String contactDetails) {
        this.contactDetails = contactDetails;
    }

    public String getAdminNote() {
        return adminNote;
    }

    public void setAdminNote(String adminNote) {
        this.adminNote = adminNote;
    }

    public String getAssignedTechnicianId() {
        return assignedTechnicianId;
    }

    public void setAssignedTechnicianId(String assignedTechnicianId) {
        this.assignedTechnicianId = assignedTechnicianId;
    }

    public String getAssignedTechnicianName() {
        return assignedTechnicianName;
    }

    public void setAssignedTechnicianName(String assignedTechnicianName) {
        this.assignedTechnicianName = assignedTechnicianName;
    }

    public String getResolutionNote() {
        return resolutionNote;
    }

    public void setResolutionNote(String resolutionNote) {
        this.resolutionNote = resolutionNote;
    }

    public Instant getFinalizedAt() {
        return finalizedAt;
    }

    public void setFinalizedAt(Instant finalizedAt) {
        this.finalizedAt = finalizedAt;
    }

    public List<SupportTicketComment> getComments() {
        return comments;
    }

    public void setComments(List<SupportTicketComment> comments) {
        this.comments = comments;
    }

    public List<SupportTicketAttachment> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<SupportTicketAttachment> attachments) {
        this.attachments = attachments;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Instant getFirstResponseAt() {
        return firstResponseAt;
    }

    public void setFirstResponseAt(Instant firstResponseAt) {
        this.firstResponseAt = firstResponseAt;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
}