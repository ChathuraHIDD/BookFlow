package com.bookflow.backend.bookings.audit.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.bookflow.backend.bookings.audit.model.BookingAuditEvent;
import com.bookflow.backend.bookings.audit.model.BookingAuditType;

public interface BookingAuditEventRepository extends MongoRepository<BookingAuditEvent, String> {

    List<BookingAuditEvent> findByBookingIdAndBookingTypeOrderByTimestampAsc(String bookingId, BookingAuditType bookingType);
}
