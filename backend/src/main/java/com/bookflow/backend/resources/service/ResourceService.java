package com.bookflow.backend.resources.service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.bookings.audit.dto.BookingAuditEventResponse;
import com.bookflow.backend.bookings.audit.model.BookingAuditType;
import com.bookflow.backend.bookings.audit.service.BookingAuditService;
import com.bookflow.backend.resources.dto.CreateResourceBookingRequest;
import com.bookflow.backend.resources.dto.ResourceBookingResponse;
import com.bookflow.backend.resources.dto.ResourceResponse;
import com.bookflow.backend.resources.model.Resource;
import com.bookflow.backend.resources.model.ResourceBooking;
import com.bookflow.backend.resources.model.ResourceBookingStatus;
import com.bookflow.backend.resources.model.ResourceOperationalStatus;

import com.bookflow.backend.resources.repository.ResourceBookingRepository;
import com.bookflow.backend.resources.repository.ResourceRepository;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final ResourceBookingRepository resourceBookingRepository;
    private final com.bookflow.backend.notifications.service.NotificationService notificationService;
    private final BookingAuditService bookingAuditService;

    public ResourceService(
            ResourceRepository resourceRepository,
            ResourceBookingRepository resourceBookingRepository,
            com.bookflow.backend.notifications.service.NotificationService notificationService,
            BookingAuditService bookingAuditService) {
        this.resourceRepository = resourceRepository;
        this.resourceBookingRepository = resourceBookingRepository;
        this.notificationService = notificationService;
        this.bookingAuditService = bookingAuditService;
    }

    public List<ResourceResponse> getAllResources() {
        return resourceRepository.findAll().stream()
                .map(this::toResourceResponse)
                .collect(Collectors.toList());
    }

    public List<ResourceResponse> getResourcesByCategory(String category) {
        return resourceRepository.findByCategory(category).stream()
                .map(this::toResourceResponse)
                .collect(Collectors.toList());
    }

    public ResourceResponse getResourceById(String id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Resource not found"));
        return toResourceResponse(resource);
    }

    public ResourceResponse getResourceBySlug(String slug) {
        Resource resource = resourceRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Resource not found"));
        return toResourceResponse(resource);
    }

    public ResourceBookingResponse createBooking(User user, CreateResourceBookingRequest request) {
        Resource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new IllegalArgumentException("Resource not found"));

        if (resource.getOperationalStatus() == ResourceOperationalStatus.UNAVAILABLE) {
            throw new IllegalArgumentException("Resource is unavailable");
        }

        if (request.getStartTime().isAfter(request.getEndTime()) || request.getStartTime().equals(request.getEndTime())) {
            throw new IllegalArgumentException("Invalid time range");
        }

        boolean conflict = resourceBookingRepository.findByResourceIdAndBookingDate(resource.getId(), request.getBookingDate()).stream()
                .filter(existing -> existing.getStatus() == ResourceBookingStatus.PENDING || existing.getStatus() == ResourceBookingStatus.APPROVED)
                .anyMatch(existing -> request.getStartTime().isBefore(existing.getEndTime()) && request.getEndTime().isAfter(existing.getStartTime()));

        if (conflict) {
            throw new IllegalArgumentException("Selected time slot is already booked");
        }

        ResourceBooking booking = new ResourceBooking();
        booking.setResourceId(resource.getId());
        booking.setResourceName(resource.getName());
        booking.setResourceCategory(resource.getCategory());
        booking.setUserId(user.getId());
        booking.setRequestedByName(user.getFullName());
        booking.setBookingDate(request.getBookingDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setStatus(ResourceBookingStatus.PENDING);
        booking.setCreatedAt(Instant.now());

        ResourceBooking savedBooking = resourceBookingRepository.save(booking);
        bookingAuditService.recordEvent(
            savedBooking.getId(),
            BookingAuditType.RESOURCE,
            "CREATED",
            null,
            savedBooking.getStatus() != null ? savedBooking.getStatus().name() : "UNKNOWN",
            user,
            "Resource booking submitted",
            "SYSTEM",
            "SYSTEM",
            "SYSTEM");
        notificationService.notifyResourceBookingSubmitted(savedBooking);

        return toBookingResponse(savedBooking);
    }

    public List<ResourceBookingResponse> getUserBookings(String userId) {
        return resourceBookingRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toBookingResponse)
                .collect(Collectors.toList());
    }

    public List<ResourceBookingResponse> getAllBookings() {
        return resourceBookingRepository.findAll().stream()
                .map(this::toBookingResponse)
                .collect(Collectors.toList());
    }

    public ResourceBookingResponse updateBookingStatus(
            String bookingId,
            ResourceBookingStatus status,
            String reason,
            User actor,
            String ipAddress,
            String userAgent,
            String sessionId) {
        ResourceBooking booking = resourceBookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        ResourceBookingStatus previousStatus = booking.getStatus();

        if (status == ResourceBookingStatus.APPROVED) {
            validateApprovalConflict(booking);
        }

        booking.setStatus(status);
        ResourceBooking savedBooking = resourceBookingRepository.save(booking);
        
        if (status == ResourceBookingStatus.APPROVED) {
            notificationService.notifyResourceBookingApproved(savedBooking);
        } else if (status == ResourceBookingStatus.REJECTED || status == ResourceBookingStatus.CANCELLED) {
            notificationService.notifyResourceBookingRejected(savedBooking);
        }

        bookingAuditService.recordEvent(
                savedBooking.getId(),
                BookingAuditType.RESOURCE,
                "STATUS_UPDATED",
                previousStatus != null ? previousStatus.name() : null,
                status.name(),
                actor,
                reason,
                ipAddress,
                userAgent,
                sessionId);
        
        return toBookingResponse(savedBooking);
    }

    public List<BookingAuditEventResponse> bookingAuditTimeline(String bookingId) {
        return bookingAuditService.getTimeline(bookingId, BookingAuditType.RESOURCE);
    }

    private ResourceResponse toResourceResponse(Resource resource) {
        return new ResourceResponse(
                resource.getId(),
                resource.getSlug(),
                resource.getName(),
                resource.getCategory(),
                resource.getDescription(),
                resource.getLocations(),
                resource.getEquipment(),
                resource.getOperationalStatus() != null ? resource.getOperationalStatus().name() : "UNKNOWN"
        );
    }

    private ResourceBookingResponse toBookingResponse(ResourceBooking booking) {
        return new ResourceBookingResponse(
                booking.getId(),
                booking.getResourceId(),
                booking.getResourceName(),
                booking.getResourceCategory(),
                booking.getBookingDate() != null ? booking.getBookingDate().toString() : "",
                booking.getStartTime() != null ? booking.getStartTime().toString() : "",
                booking.getEndTime() != null ? booking.getEndTime().toString() : "",
                booking.getStatus() != null ? booking.getStatus().name() : "UNKNOWN",
                booking.getRequestedByName(),
                booking.getUserId(),
                booking.getCreatedAt() != null ? booking.getCreatedAt().toString() : ""
        );
    }

    private void validateApprovalConflict(ResourceBooking booking) {
        List<ResourceBooking> conflicts = resourceBookingRepository.findByResourceIdAndBookingDate(booking.getResourceId(), booking.getBookingDate()).stream()
                .filter(existing -> !booking.getId().equals(existing.getId()))
                .filter(existing -> existing.getStatus() == ResourceBookingStatus.PENDING || existing.getStatus() == ResourceBookingStatus.APPROVED)
                .filter(existing -> booking.getStartTime().isBefore(existing.getEndTime()) && booking.getEndTime().isAfter(existing.getStartTime()))
                .toList();

        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException("This booking conflicts with an existing reservation");
        }
    }
}
