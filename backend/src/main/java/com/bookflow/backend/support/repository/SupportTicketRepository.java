package com.bookflow.backend.support.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.bookflow.backend.support.model.SupportTicket;
import com.bookflow.backend.support.model.SupportTicketStatus;

public interface SupportTicketRepository extends MongoRepository<SupportTicket, String> {
    List<SupportTicket> findByUserIdOrderByUpdatedAtDesc(String userId);

    List<SupportTicket> findByAssignedTechnicianIdOrderByUpdatedAtDesc(String assignedTechnicianId);

    List<SupportTicket> findAllByOrderByUpdatedAtDesc();

    Optional<SupportTicket> findByUserIdAndId(String userId, String id);

    Optional<SupportTicket> findByAssignedTechnicianIdAndId(String assignedTechnicianId, String id);

    Optional<SupportTicket> findByTicketNumber(String ticketNumber);

    long countByUserId(String userId);

    long countByUserIdAndStatus(String userId, SupportTicketStatus status);
}