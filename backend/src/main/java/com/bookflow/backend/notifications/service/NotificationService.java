package com.bookflow.backend.notifications.service;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.auth.dto.MessageResponse;
import com.bookflow.backend.auth.model.UserRole;
import com.bookflow.backend.auth.repository.UserRepository;
import com.bookflow.backend.facilities.model.FacilityBooking;
import com.bookflow.backend.notifications.dto.NotificationResponse;
import com.bookflow.backend.notifications.model.UserNotification;
import com.bookflow.backend.notifications.repository.UserNotificationRepository;
import com.bookflow.backend.profile.model.ProfileUpdateRequest;

@Service
public class NotificationService {

    private static final String USER_MANAGEMENT = "USER_MANAGEMENT";
    private static final String RESOURCE_MANAGEMENT = "RESOURCE_MANAGEMENT";
    private static final String TICKET_MANAGEMENT = "TICKET_MANAGEMENT";
    private static final String BOOKING_MANAGEMENT = "BOOKING_MANAGEMENT";

    private final UserNotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(UserNotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public List<NotificationResponse> myNotifications(User user) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    public long myUnreadCount(User user) {
        return notificationRepository.countByUserIdAndReadIsFalse(user.getId());
    }

    public NotificationResponse markAsRead(User user, String notificationId) {
        UserNotification notification = getOwnedNotification(user, notificationId);
        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(Instant.now());
            notification = notificationRepository.save(notification);
        }
        return toResponse(notification);
    }

    public MessageResponse deleteNotification(User user, String notificationId) {
        UserNotification notification = getOwnedNotification(user, notificationId);
        notificationRepository.delete(notification);
        return new MessageResponse("Notification deleted");
    }

    public MessageResponse clearAll(User user) {
        long deletedCount = notificationRepository.deleteByUserId(user.getId());
        return new MessageResponse("Cleared " + deletedCount + " notifications");
    }

    public void notifyBookingApproved(FacilityBooking booking) {
        if (booking.getUserId() == null || booking.getUserId().isBlank()) {
            return;
        }

        UserNotification notification = new UserNotification();
        notification.setUserId(booking.getUserId());
        notification.setTitle("Facility Booking Approved");
        notification.setMessage(String.format(
                "Your booking for %s on %s (%s - %s) has been approved.",
                defaultText(booking.getRoomNumber(), "room"),
                booking.getBookingDate() != null ? booking.getBookingDate().toString() : "the selected date",
                booking.getStartTime() != null ? booking.getStartTime().toString() : "start",
                booking.getEndTime() != null ? booking.getEndTime().toString() : "end"));
        notification.setCategory(BOOKING_MANAGEMENT);
        notification.setActionUrl("/student/dashboard");
        notification.setCreatedAt(Instant.now());
        notificationRepository.save(notification);
    }

    public void notifyBookingCancelled(FacilityBooking booking) {
        if (booking.getUserId() == null || booking.getUserId().isBlank()) {
            return;
        }

        UserNotification notification = new UserNotification();
        notification.setUserId(booking.getUserId());
        notification.setTitle("Facility Booking Cancelled");
        notification.setMessage(String.format(
                "Your booking for %s on %s (%s - %s) has been cancelled by admin.",
                defaultText(booking.getRoomNumber(), "room"),
                booking.getBookingDate() != null ? booking.getBookingDate().toString() : "the selected date",
                booking.getStartTime() != null ? booking.getStartTime().toString() : "start",
                booking.getEndTime() != null ? booking.getEndTime().toString() : "end"));
        notification.setCategory(BOOKING_MANAGEMENT);
        notification.setActionUrl("/student/dashboard");
        notification.setCreatedAt(Instant.now());
        notificationRepository.save(notification);
    }

    public void notifyResourceBookingSubmitted(com.bookflow.backend.resources.model.ResourceBooking booking) {
        if (booking.getUserId() == null || booking.getUserId().isBlank()) {
            return;
        }

        notifyUser(booking.getUserId(), "Resource Booking Submitted",
                String.format("Your booking request for %s on %s is pending admin approval.",
                        defaultText(booking.getResourceName(), "resource"),
                        booking.getBookingDate() != null ? booking.getBookingDate().toString() : "the selected date"),
                BOOKING_MANAGEMENT, "/student/dashboard");
        
        notifyAdmins("New Resource Booking Request",
                String.format("User %s requested to book %s on %s.",
                        defaultText(booking.getRequestedByName(), "Unknown user"),
                        defaultText(booking.getResourceName(), "resource"),
                        booking.getBookingDate() != null ? booking.getBookingDate().toString() : "the selected date"),
                BOOKING_MANAGEMENT, "/admin/bookings");
    }

    public void notifyResourceBookingApproved(com.bookflow.backend.resources.model.ResourceBooking booking) {
        if (booking.getUserId() == null || booking.getUserId().isBlank()) {
            return;
        }

        notifyUser(booking.getUserId(), "Resource Booking Approved",
                String.format("Your booking for %s on %s (%s - %s) has been approved.",
                        defaultText(booking.getResourceName(), "resource"),
                        booking.getBookingDate() != null ? booking.getBookingDate().toString() : "the selected date",
                        booking.getStartTime() != null ? booking.getStartTime().toString() : "start",
                        booking.getEndTime() != null ? booking.getEndTime().toString() : "end"),
                BOOKING_MANAGEMENT, "/student/dashboard");
    }

    public void notifyResourceBookingRejected(com.bookflow.backend.resources.model.ResourceBooking booking) {
        if (booking.getUserId() == null || booking.getUserId().isBlank()) {
            return;
        }

        notifyUser(booking.getUserId(), "Resource Booking Rejected",
                String.format("Your booking request for %s on %s has been rejected by admin.",
                        defaultText(booking.getResourceName(), "resource"),
                        booking.getBookingDate() != null ? booking.getBookingDate().toString() : "the selected date"),
                BOOKING_MANAGEMENT, "/student/dashboard");
    }

    public void notifyProfileUpdateSubmitted(User user, ProfileUpdateRequest request) {
        notifyUser(user.getId(), "Profile Update Request Submitted",
                "Your profile update request is now pending admin review.", USER_MANAGEMENT, "/student/profile");
        notifyAdmins("New Profile Update Request",
                String.format("%s (%s) submitted a profile update request.", user.getFullName(), user.getEmail()), USER_MANAGEMENT, "/admin/users");
    }

    public void notifyProfileUpdateApproved(User user, ProfileUpdateRequest request) {
        notifyUser(user.getId(), "Profile Update Approved",
                "Your profile changes were approved and your account details were updated.", USER_MANAGEMENT, "/student/profile");
        notifyAdmins("Profile Update Approved",
                String.format("Profile update for %s (%s) was approved.", user.getFullName(), user.getEmail()), USER_MANAGEMENT, "/admin/users");
    }

    public void notifyProfileUpdateDeclined(User user, ProfileUpdateRequest request) {
        String note = request.getAdminNote() != null && !request.getAdminNote().isBlank()
                ? " Note: " + request.getAdminNote()
                : "";
        notifyUser(user.getId(), "Profile Update Declined",
                "Your profile update request was declined." + note, USER_MANAGEMENT, "/student/profile");
        notifyAdmins("Profile Update Declined",
                String.format("Profile update for %s (%s) was declined.", user.getFullName(), user.getEmail()), USER_MANAGEMENT, "/admin/users");
    }

    public void notifyUser(String userId, String title, String message) {
        notifyUser(userId, title, message, inferCategory(title, message), null);
    }

    public void notifyUser(String userId, String title, String message, String category) {
        notifyUser(userId, title, message, category, null);
    }

    public void notifyUser(String userId, String title, String message, String category, String actionUrl) {
        if (userId == null || userId.isBlank()) {
            return;
        }

        UserNotification notification = new UserNotification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setCategory(normalizeCategory(category));
        notification.setActionUrl(actionUrl);
        notification.setRead(false);
        notification.setReadAt(null);
        notification.setCreatedAt(Instant.now());
        notificationRepository.save(notification);
    }

    public void notifyAdmins(String title, String message) {
        notifyAdmins(title, message, inferCategory(title, message), null);
    }

    public void notifyAdmins(String title, String message, String category) {
        notifyAdmins(title, message, category, null);
    }

    public void notifyAdmins(String title, String message, String category, String actionUrl) {
        String normalizedCategory = normalizeCategory(category);
        userRepository.findAllByRole(UserRole.ADMIN)
                .forEach(admin -> notifyUser(admin.getId(), title, message, normalizedCategory, actionUrl));
    }

    private NotificationResponse toResponse(UserNotification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getCreatedAt() != null ? notification.getCreatedAt().toString() : "",
                normalizeCategory(notification.getCategory(), notification.getTitle(), notification.getMessage()),
                notification.getActionUrl(),
                notification.isRead());
    }

    private UserNotification getOwnedNotification(User user, String notificationId) {
        UserNotification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));

        if (notification.getUserId() == null || !notification.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot modify this notification");
        }
        return notification;
    }

    private String defaultText(String value, String fallback) {
        return value != null && !value.isBlank() ? value : fallback;
    }

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank()) {
            return RESOURCE_MANAGEMENT;
        }

        return switch (category.trim().toUpperCase()) {
            case USER_MANAGEMENT -> USER_MANAGEMENT;
            case RESOURCE_MANAGEMENT -> RESOURCE_MANAGEMENT;
            case TICKET_MANAGEMENT -> TICKET_MANAGEMENT;
            case BOOKING_MANAGEMENT -> BOOKING_MANAGEMENT;
            default -> RESOURCE_MANAGEMENT;
        };
    }

    private String normalizeCategory(String category, String title, String message) {
        if (category == null || category.isBlank()) {
            return inferCategory(title, message);
        }
        return normalizeCategory(category);
    }

    private String inferCategory(String title, String message) {
        String text = (defaultText(title, "") + " " + defaultText(message, "")).toLowerCase();

        if (text.contains("profile") || text.contains("user") || text.contains("account")) {
            return USER_MANAGEMENT;
        }

        if (text.contains("ticket") || text.contains("support") || text.contains("issue")) {
            return TICKET_MANAGEMENT;
        }

        if (text.contains("booking") || text.contains("reservation") || text.contains("slot")) {
            return BOOKING_MANAGEMENT;
        }

        return RESOURCE_MANAGEMENT;
    }
}
