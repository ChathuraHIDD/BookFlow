package com.bookflow.backend.profile.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.bookflow.backend.profile.model.ProfileUpdateRequest;
import com.bookflow.backend.profile.model.ProfileUpdateStatus;

public interface ProfileUpdateRequestRepository extends MongoRepository<ProfileUpdateRequest, String> {

    List<ProfileUpdateRequest> findByUserIdOrderByRequestedAtDesc(String userId);

    List<ProfileUpdateRequest> findByStatusOrderByRequestedAtDesc(ProfileUpdateStatus status);

    Optional<ProfileUpdateRequest> findByIdAndStatus(String id, ProfileUpdateStatus status);
}
