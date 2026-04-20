package com.bookflow.backend.facilities.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.facilities.dto.BookingResponse;
import com.bookflow.backend.facilities.dto.BuildingSummaryResponse;
import com.bookflow.backend.facilities.dto.ClassroomResponse;
import com.bookflow.backend.facilities.dto.CreateBookingRequest;
import com.bookflow.backend.facilities.dto.CreateBuildingRequest;
import com.bookflow.backend.facilities.dto.CreateClassroomRequest;
import com.bookflow.backend.facilities.dto.FacilityReportResponse;
import com.bookflow.backend.facilities.dto.FloorSummaryResponse;
import com.bookflow.backend.facilities.dto.StudentFacilitiesOverviewResponse;
import com.bookflow.backend.facilities.dto.UpdateBookingStatusRequest;
import com.bookflow.backend.facilities.dto.UpdateBuildingFloorsRequest;
import com.bookflow.backend.facilities.dto.UpdateClassroomRequest;
import com.bookflow.backend.facilities.model.BookingStatus;
import com.bookflow.backend.facilities.model.Building;
import com.bookflow.backend.facilities.model.Classroom;
import com.bookflow.backend.facilities.model.FacilityBooking;
import com.bookflow.backend.facilities.model.FacilityOperationalStatus;
import com.bookflow.backend.facilities.repository.BuildingRepository;
import com.bookflow.backend.facilities.repository.ClassroomRepository;
import com.bookflow.backend.facilities.repository.FacilityBookingRepository;
import com.bookflow.backend.notifications.service.NotificationService;

@Service
public class FacilitiesService {

    private final BuildingRepository buildingRepository;
    private final ClassroomRepository classroomRepository;
    private final FacilityBookingRepository bookingRepository;
    private final NotificationService notificationService;

    public FacilitiesService(
            BuildingRepository buildingRepository,
            ClassroomRepository classroomRepository,
            FacilityBookingRepository bookingRepository,
            NotificationService notificationService) {
        this.buildingRepository = buildingRepository;
        this.classroomRepository = classroomRepository;
        this.bookingRepository = bookingRepository;
        this.notificationService = notificationService;
    }

    public StudentFacilitiesOverviewResponse studentOverview(User user) {
        return new StudentFacilitiesOverviewResponse(
                buildingSummaries(),
                bookingRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                        .map(this::toBookingResponse)
                        .toList());
    }

    public List<BuildingSummaryResponse> buildingSummaries() {
        return buildingRepository.findAll().stream()
                .sorted(Comparator.comparing(Building::getName))
                .map(building -> new BuildingSummaryResponse(
                        building.getId(),
                        building.getName(),
                        building.getCode(),
                        building.getFloorCount(),
                        classroomRepository.findByBuildingIdOrderByFloorNumberAscRoomNumberAsc(building.getId()).size()))
                .toList();
    }

    public List<FloorSummaryResponse> floorsForBuilding(String buildingId) {
        Building building = getBuilding(buildingId);
        return java.util.stream.IntStream.rangeClosed(1, building.getFloorCount())
                .mapToObj(floor -> new FloorSummaryResponse(
                        floor,
                        "Floor " + floor,
                        classroomRepository.countByBuildingIdAndFloorNumber(buildingId, floor)))
                .toList();
    }

    public List<ClassroomResponse> classroomsForFloor(String buildingId, int floorNumber, LocalDate date) {
        getBuilding(buildingId);
        return classroomRepository.findByBuildingIdAndFloorNumberOrderByRoomNumberAsc(buildingId, floorNumber).stream()
                .map(classroom -> toClassroomResponse(classroom, date))
                .toList();
    }

    public BookingResponse createBooking(User user, CreateBookingRequest request) {
        Classroom classroom = classroomRepository.findById(request.getClassroomId())
                .orElseThrow(() -> new IllegalArgumentException("Classroom not found"));

        if (classroom.getOperationalStatus() == FacilityOperationalStatus.UNAVAILABLE) {
            throw new IllegalArgumentException("Classroom is unavailable");
        }

        if (request.getStartTime().isAfter(request.getEndTime()) || request.getStartTime().equals(request.getEndTime())) {
            throw new IllegalArgumentException("Invalid time range");
        }

        boolean conflict = bookingRepository.findByClassroomIdAndBookingDate(classroom.getId(), request.getBookingDate()).stream()
                .filter(existing -> existing.getStatus() == BookingStatus.PENDING || existing.getStatus() == BookingStatus.APPROVED)
                .anyMatch(existing -> overlaps(existing, request));

        if (conflict) {
            throw new IllegalArgumentException("Selected time slot is already booked");
        }

        FacilityBooking booking = new FacilityBooking();
        booking.setBuildingId(classroom.getBuildingId());
        booking.setBuildingName(classroom.getBuildingName());
        booking.setClassroomId(classroom.getId());
        booking.setFloorNumber(classroom.getFloorNumber());
        booking.setRoomNumber(classroom.getRoomNumber());
        booking.setBookingDate(request.getBookingDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setUserId(user.getId());
        booking.setRequestedByName(user.getFullName());
        booking.setStatus(BookingStatus.PENDING);
        booking.setCreatedAt(Instant.now());
        return toBookingResponse(bookingRepository.save(booking));
    }

    public List<BookingResponse> studentBookings(User user) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toBookingResponse)
                .toList();
    }

    public BuildingSummaryResponse createBuilding(CreateBuildingRequest request) {
        Building building = new Building();
        building.setName(request.getName().trim());
        building.setCode(request.getCode().trim().toUpperCase(Locale.ROOT));
        building.setFloorCount(request.getFloorCount());
        building.setCreatedAt(Instant.now());
        Building saved = buildingRepository.save(building);
        return new BuildingSummaryResponse(saved.getId(), saved.getName(), saved.getCode(), saved.getFloorCount(), 0);
    }

    public ClassroomResponse addClassroom(String buildingId, int floorNumber, CreateClassroomRequest request) {
        Building building = getBuilding(buildingId);
        Classroom classroom = new Classroom();
        classroom.setBuildingId(buildingId);
        classroom.setBuildingName(building.getName());
        classroom.setFloorNumber(floorNumber);
        classroom.setRoomNumber(request.getRoomNumber().trim());
        classroom.setCapacity(request.getCapacity());
        classroom.setType(request.getType().trim());
        classroom.setEquipment(request.getEquipment());
        classroom.setOperationalStatus(FacilityOperationalStatus.AVAILABLE);
        classroom.setCreatedAt(Instant.now());
        return toClassroomResponse(classroomRepository.save(classroom), null);
    }

    public BuildingSummaryResponse updateBuildingFloors(String buildingId, UpdateBuildingFloorsRequest request) {
        Building building = getBuilding(buildingId);
        building.setFloorCount(request.getFloorCount());
        Building saved = buildingRepository.save(building);
        return new BuildingSummaryResponse(
                saved.getId(),
                saved.getName(),
                saved.getCode(),
                saved.getFloorCount(),
                classroomRepository.findByBuildingIdOrderByFloorNumberAscRoomNumberAsc(saved.getId()).size());
    }

    public ClassroomResponse updateClassroom(String classroomId, UpdateClassroomRequest request) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new IllegalArgumentException("Classroom not found"));
        classroom.setRoomNumber(request.getRoomNumber().trim());
        classroom.setCapacity(request.getCapacity());
        classroom.setType(request.getType().trim());
        classroom.setEquipment(request.getEquipment());
        return toClassroomResponse(classroomRepository.save(classroom), null);
    }

    public void deleteClassroom(String classroomId) {
        classroomRepository.deleteById(classroomId);
    }

    public ClassroomResponse updateClassroomStatus(String classroomId, String status) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new IllegalArgumentException("Classroom not found"));
        classroom.setOperationalStatus(parseOperationalStatus(status));
        return toClassroomResponse(classroomRepository.save(classroom), null);
    }

    public List<BookingResponse> allBookings() {
        return bookingRepository.findAll().stream()
                .sorted(Comparator.comparing(FacilityBooking::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toBookingResponse)
                .toList();
    }

    public BookingResponse updateBookingStatus(String bookingId, UpdateBookingStatusRequest request) {
        FacilityBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        BookingStatus previousStatus = booking.getStatus();
        BookingStatus nextStatus = parseBookingStatus(request.getStatus());
        booking.setStatus(nextStatus);
        FacilityBooking saved = bookingRepository.save(booking);

        if (nextStatus == BookingStatus.APPROVED && previousStatus != BookingStatus.APPROVED) {
            notificationService.notifyBookingApproved(saved);
        }

        if (nextStatus == BookingStatus.CANCELLED && previousStatus != BookingStatus.CANCELLED) {
            notificationService.notifyBookingCancelled(saved);
        }

        return toBookingResponse(saved);
    }

    public FacilityReportResponse reports() {
        return new FacilityReportResponse(
                buildingRepository.count(),
                classroomRepository.count(),
                bookingRepository.count(),
                bookingRepository.countByStatusIn(List.of(BookingStatus.PENDING)),
                classroomRepository.findAll().stream().filter(room -> room.getOperationalStatus() == FacilityOperationalStatus.UNAVAILABLE).count());
    }

    private ClassroomResponse toClassroomResponse(Classroom classroom, LocalDate date) {
        String status = classroom.getOperationalStatus() == FacilityOperationalStatus.UNAVAILABLE
                ? "UNAVAILABLE"
                : effectiveBookingState(classroom, date);
        return new ClassroomResponse(
                classroom.getId(),
                classroom.getRoomNumber(),
                classroom.getCapacity(),
                classroom.getType(),
                classroom.getEquipment(),
                status);
    }

    private String effectiveBookingState(Classroom classroom, LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        boolean booked = bookingRepository.findByClassroomIdAndBookingDate(classroom.getId(), targetDate).stream()
                .anyMatch(booking -> booking.getStatus() == BookingStatus.PENDING || booking.getStatus() == BookingStatus.APPROVED);
        return booked ? "BOOKED" : "AVAILABLE";
    }

    private BookingResponse toBookingResponse(FacilityBooking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getBuildingName(),
                booking.getFloorNumber(),
                booking.getRoomNumber(),
                formatDate(booking.getBookingDate()),
                formatTime(booking.getStartTime()),
                formatTime(booking.getEndTime()),
                booking.getStatus() != null ? booking.getStatus().name() : "UNKNOWN",
                booking.getRequestedByName());
    }

    private String formatDate(LocalDate value) {
        return value != null ? value.toString() : "";
    }

    private String formatTime(LocalTime value) {
        return value != null ? value.toString() : "";
    }

    private boolean overlaps(FacilityBooking existing, CreateBookingRequest request) {
        return request.getStartTime().isBefore(existing.getEndTime())
                && request.getEndTime().isAfter(existing.getStartTime());
    }

    private Building getBuilding(String buildingId) {
        return buildingRepository.findById(buildingId)
                .orElseThrow(() -> new IllegalArgumentException("Building not found"));
    }

    private FacilityOperationalStatus parseOperationalStatus(String raw) {
        if (!StringUtils.hasText(raw)) {
            throw new IllegalArgumentException("Status is required");
        }
        return FacilityOperationalStatus.valueOf(raw.trim().toUpperCase(Locale.ROOT));
    }

    private BookingStatus parseBookingStatus(String raw) {
        if (!StringUtils.hasText(raw)) {
            throw new IllegalArgumentException("Booking status is required");
        }
        BookingStatus parsed = BookingStatus.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        Set<BookingStatus> allowed = Set.of(BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.REJECTED, BookingStatus.CANCELLED);
        if (!allowed.contains(parsed)) {
            throw new IllegalArgumentException("Unsupported booking status");
        }
        return parsed;
    }
}
