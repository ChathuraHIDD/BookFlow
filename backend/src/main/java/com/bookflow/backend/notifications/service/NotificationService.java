package com.bookflow.backend.notifications.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;

import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.facilities.model.FacilityBooking;
import com.bookflow.backend.notifications.dto.NotificationResponse;
import com.bookflow.backend.notifications.model.UserNotification;
import com.bookflow.backend.notifications.repository.UserNotificationRepository;

@Service
public class NotificationService {

    private final UserNotificationRepository notificationRepository;

    public NotificationService(UserNotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public List<NotificationResponse> myNotifications(User user) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toResponse)
                .toList();
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

    private NotificationResponse toResponse(UserNotification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getCreatedAt() != null ? notification.getCreatedAt().toString() : "");
    }

    private String defaultText(String value, String fallback) {
        return value != null && !value.isBlank() ? value : fallback;
    }
}
