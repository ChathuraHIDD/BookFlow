package com.bookflow.backend.facilities.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.bookflow.backend.facilities.model.Classroom;

public interface ClassroomRepository extends MongoRepository<Classroom, String> {
    List<Classroom> findByBuildingIdOrderByFloorNumberAscRoomNumberAsc(String buildingId);

    List<Classroom> findByBuildingIdAndFloorNumberOrderByRoomNumberAsc(String buildingId, int floorNumber);

    long countByBuildingIdAndFloorNumber(String buildingId, int floorNumber);
}
