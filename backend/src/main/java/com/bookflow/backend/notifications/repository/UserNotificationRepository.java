package com.bookflow.backend.notifications.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.bookflow.backend.notifications.model.UserNotification;

public interface UserNotificationRepository extends MongoRepository<UserNotification, String> {
    List<UserNotification> findByUserIdOrderByCreatedAtDesc(String userId);

    long countByUserIdAndReadIsFalse(String userId);

    long deleteByUserId(String userId);
}
