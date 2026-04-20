package com.bookflow.backend.facilities.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.bookflow.backend.facilities.model.Building;

public interface BuildingRepository extends MongoRepository<Building, String> {
    Optional<Building> findByCode(String code);
}
