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
        notification.setCreatedAt(Instant.now());
        notificationRepository.save(notification);
    }

    public void notifyProfileUpdateSubmitted(User user, ProfileUpdateRequest request) {
        notifyUser(user.getId(), "Profile Update Request Submitted",
                "Your profile update request is now pending admin review.");
        notifyAdmins("New Profile Update Request",
                String.format("%s (%s) submitted a profile update request.", user.getFullName(), user.getEmail()));
    }

    public void notifyProfileUpdateApproved(User user, ProfileUpdateRequest request) {
        notifyUser(user.getId(), "Profile Update Approved",
                "Your profile changes were approved and your account details were updated.");
        notifyAdmins("Profile Update Approved",
                String.format("Profile update for %s (%s) was approved.", user.getFullName(), user.getEmail()));
    }

    public void notifyProfileUpdateDeclined(User user, ProfileUpdateRequest request) {
        String note = request.getAdminNote() != null && !request.getAdminNote().isBlank()
                ? " Note: " + request.getAdminNote()
                : "";
        notifyUser(user.getId(), "Profile Update Declined",
                "Your profile update request was declined." + note);
        notifyAdmins("Profile Update Declined",
                String.format("Profile update for %s (%s) was declined.", user.getFullName(), user.getEmail()));
    }

    public void notifyUser(String userId, String title, String message) {
        if (userId == null || userId.isBlank()) {
            return;
        }

        UserNotification notification = new UserNotification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRead(false);
        notification.setReadAt(null);
        notification.setCreatedAt(Instant.now());
        notificationRepository.save(notification);
    }

    public void notifyAdmins(String title, String message) {
        userRepository.findAllByRole(UserRole.ADMIN).forEach(admin -> notifyUser(admin.getId(), title, message));
    }

    private NotificationResponse toResponse(UserNotification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getCreatedAt() != null ? notification.getCreatedAt().toString() : "",
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
}
