package com.bookflow.backend.resources.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.bookflow.backend.resources.model.ResourceBooking;
import com.bookflow.backend.resources.model.ResourceBookingStatus;

@Repository
public interface ResourceBookingRepository extends MongoRepository<ResourceBooking, String> {

    List<ResourceBooking> findByUserIdOrderByCreatedAtDesc(String userId);

    List<ResourceBooking> findByResourceIdAndBookingDate(String resourceId, LocalDate bookingDate);

    List<ResourceBooking> findByStatusIn(List<ResourceBookingStatus> statuses);

    long countByStatusIn(List<ResourceBookingStatus> statuses);
}
