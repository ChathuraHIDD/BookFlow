package com.bookflow.backend.facilities.config;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.bookflow.backend.facilities.model.BookingStatus;
import com.bookflow.backend.facilities.model.Building;
import com.bookflow.backend.facilities.model.Classroom;
import com.bookflow.backend.facilities.model.FacilityBooking;
import com.bookflow.backend.facilities.model.FacilityOperationalStatus;
import com.bookflow.backend.facilities.repository.BuildingRepository;
import com.bookflow.backend.facilities.repository.ClassroomRepository;
import com.bookflow.backend.facilities.repository.FacilityBookingRepository;

@Configuration
public class FacilitiesSeedConfig {

    @Bean
    ApplicationRunner facilitiesSeeder(
            BuildingRepository buildingRepository,
            ClassroomRepository classroomRepository,
            FacilityBookingRepository bookingRepository) {
        return args -> {
            if (buildingRepository.count() > 0) {
                return;
            }

            List<Building> buildings = List.of(
                    building("Main Building", "MB", 7),
                    building("New Building", "NB", 14),
                    building("Engineering Building", "ENG", 8),
                    building("Business Building", "BUS", 5));
            List<Building> savedBuildings = buildingRepository.saveAll(buildings);

            List<Classroom> classrooms = savedBuildings.stream()
                    .flatMap(building -> java.util.stream.IntStream.rangeClosed(1, building.getFloorCount())
                            .boxed()
                            .flatMap(floor -> java.util.stream.IntStream.rangeClosed(1, 6)
                                    .mapToObj(index -> classroom(building, floor, index))))
                    .toList();
            List<Classroom> savedClassrooms = classroomRepository.saveAll(classrooms);

            if (!savedClassrooms.isEmpty()) {
                Classroom room = savedClassrooms.get(0);
                FacilityBooking booking = new FacilityBooking();
                booking.setBuildingId(room.getBuildingId());
                booking.setBuildingName(room.getBuildingName());
                booking.setClassroomId(room.getId());
                booking.setFloorNumber(room.getFloorNumber());
                booking.setRoomNumber(room.getRoomNumber());
                booking.setBookingDate(LocalDate.now().plusDays(1));
                booking.setStartTime(LocalTime.of(9, 0));
                booking.setEndTime(LocalTime.of(11, 0));
                booking.setUserId("seed-student");
                booking.setRequestedByName("Jane Student");
                booking.setStatus(BookingStatus.APPROVED);
                booking.setCreatedAt(Instant.now());
                bookingRepository.save(booking);
            }
        };
    }

    private static Building building(String name, String code, int floorCount) {
        Building building = new Building();
        building.setName(name);
        building.setCode(code);
        building.setFloorCount(floorCount);
        building.setCreatedAt(Instant.now());
        return building;
    }

    private static Classroom classroom(Building building, int floorNumber, int index) {
        Classroom classroom = new Classroom();
        classroom.setBuildingId(building.getId());
        classroom.setBuildingName(building.getName());
        classroom.setFloorNumber(floorNumber);
        classroom.setRoomNumber(building.getCode() + "-" + String.format("%d%02d", floorNumber, index));
        classroom.setCapacity(30 + ((floorNumber + index) % 4) * 10);
        classroom.setType(index % 3 == 0 ? "Meeting Room" : index % 2 == 0 ? "Lecture Hall" : "Lab");
        classroom.setEquipment(List.of("Projector", "AC", index % 2 == 0 ? "Audio" : "PCs"));
        classroom.setOperationalStatus((floorNumber + index) % 11 == 0
                ? FacilityOperationalStatus.UNAVAILABLE
                : FacilityOperationalStatus.AVAILABLE);
        classroom.setCreatedAt(Instant.now());
        return classroom;
    }
}
