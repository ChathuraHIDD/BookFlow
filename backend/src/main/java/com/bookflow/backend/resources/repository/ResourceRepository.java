package com.bookflow.backend.resources.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.bookflow.backend.resources.model.Resource;
import com.bookflow.backend.resources.model.ResourceOperationalStatus;

@Repository
public interface ResourceRepository extends MongoRepository<Resource, String> {

    Optional<Resource> findBySlug(String slug);

    List<Resource> findByCategory(String category);

    List<Resource> findByOperationalStatus(ResourceOperationalStatus status);
}
