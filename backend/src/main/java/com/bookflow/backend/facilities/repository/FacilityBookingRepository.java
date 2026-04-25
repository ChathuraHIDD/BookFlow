package com.bookflow.backend.facilities.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.bookflow.backend.facilities.model.BookingStatus;
import com.bookflow.backend.facilities.model.FacilityBooking;

public interface FacilityBookingRepository extends MongoRepository<FacilityBooking, String> {
    List<FacilityBooking> findByUserIdOrderByCreatedAtDesc(String userId);

    long countByUserIdAndBookingDateBetween(String userId, LocalDate startDate, LocalDate endDate);

    List<FacilityBooking> findByClassroomIdAndBookingDate(String classroomId, LocalDate bookingDate);

    List<FacilityBooking> findByStatusInOrderByCreatedAtDesc(List<BookingStatus> statuses);

    long countByStatusIn(List<BookingStatus> statuses);
}
