package com.bookflow.backend.facilities.service;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.bookings.audit.dto.BookingAuditEventResponse;
import com.bookflow.backend.bookings.audit.model.BookingAuditType;
import com.bookflow.backend.bookings.audit.service.BookingAuditService;
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
    private final BookingAuditService bookingAuditService;

    public FacilitiesService(
            BuildingRepository buildingRepository,
            ClassroomRepository classroomRepository,
            FacilityBookingRepository bookingRepository,
            NotificationService notificationService,
            BookingAuditService bookingAuditService) {
        this.buildingRepository = buildingRepository;
        this.classroomRepository = classroomRepository;
        this.bookingRepository = bookingRepository;
        this.notificationService = notificationService;
        this.bookingAuditService = bookingAuditService;
    }

    public StudentFacilitiesOverviewResponse studentOverview(User user) {
        if (user == null || !StringUtils.hasText(user.getId())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        return new StudentFacilitiesOverviewResponse(
                buildingSummaries(),
                bookingRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                        .map(this::toBookingResponse)
                        .toList());
    }

    public List<BuildingSummaryResponse> buildingSummaries() {
        return buildingRepository.findAll().stream()
            .sorted(Comparator.comparing(
                building -> Objects.toString(building.getName(), ""),
                String.CASE_INSENSITIVE_ORDER))
                .map(building -> new BuildingSummaryResponse(
                        building.getId(),
                Objects.toString(building.getName(), "Unnamed Building"),
                Objects.toString(building.getCode(), "N/A"),
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

    public List<ClassroomResponse> classroomsForFloor(String buildingId, int floorNumber, LocalDate date, LocalTime startTime, LocalTime endTime) {
        getBuilding(buildingId);
        return classroomRepository.findByBuildingIdAndFloorNumberOrderByRoomNumberAsc(buildingId, floorNumber).stream()
                .map(classroom -> toClassroomResponse(classroom, date, startTime, endTime))
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

        if (request.getStartTime().isBefore(LocalTime.of(6, 0)) || request.getEndTime().isAfter(LocalTime.of(22, 0))) {
            throw new IllegalArgumentException("Booking must be between 06:00 and 22:00");
        }

        enforceWeeklyBookingLimit(user.getId(), request.getBookingDate());

        List<Integer> selectedSeats = request.getSelectedSeats() != null
                ? request.getSelectedSeats().stream().distinct().sorted().toList()
                : List.of();

        if (classroom.isSeatSelectionEnabled()) {
            if (selectedSeats.isEmpty()) {
                throw new IllegalArgumentException("Select at least one seat for this classroom");
            }
            if (selectedSeats.stream().anyMatch(seat -> seat < 1 || seat > classroom.getCapacity())) {
                throw new IllegalArgumentException("Selected seat numbers must be within the room capacity");
            }
            if (selectedSeats.size() > classroom.getCapacity()) {
                throw new IllegalArgumentException("Selected seats exceed room capacity");
            }
            validateSeatAvailability(classroom.getId(), request.getBookingDate(), request.getStartTime(), request.getEndTime(), selectedSeats);
        } else {
            validateWholeRoomAvailability(classroom.getId(), request.getBookingDate(), request.getStartTime(), request.getEndTime(), null);
        }

        boolean autoApprove = shouldAutoApprove(classroom, request, selectedSeats);
        String decisionNote = autoApprove ? "Auto-approved by booking logic" : buildReviewNote(classroom, request);

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
        booking.setPurpose(normalizeText(request.getPurpose(), "Study session"));
        booking.setPriority(normalizePriority(request.getPriority()));
        booking.setReviewRequired(!autoApprove);
        booking.setDecisionNote(decisionNote);
        booking.setStatus(autoApprove ? BookingStatus.APPROVED : BookingStatus.PENDING);
        booking.setSelectedSeats(selectedSeats);
        booking.setCreatedAt(Instant.now());
        FacilityBooking saved = bookingRepository.save(booking);

        bookingAuditService.recordEvent(
            saved.getId(),
            BookingAuditType.FACILITY,
            "CREATED",
            null,
            saved.getStatus() != null ? saved.getStatus().name() : "UNKNOWN",
            user,
            decisionNote,
            "SYSTEM",
            "SYSTEM",
            "SYSTEM");

        if (autoApprove) {
            notificationService.notifyBookingApproved(saved);
        } else {
            notificationService.notifyAdmins(
                    "New Facility Booking Request",
                    String.format("%s requested %s on %s (%s - %s). Review required.",
                            saved.getRequestedByName(),
                            saved.getRoomNumber(),
                            saved.getBookingDate(),
                            saved.getStartTime(),
                            saved.getEndTime()),
                    "BOOKING_MANAGEMENT",
                    "/admin/bookings");
        }

        return toBookingResponse(saved);
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
        return toClassroomResponse(classroomRepository.save(classroom), null, null, null);
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
        return toClassroomResponse(classroomRepository.save(classroom), null, null, null);
    }

    public void deleteClassroom(String classroomId) {
        classroomRepository.deleteById(classroomId);
    }

    public ClassroomResponse updateClassroomStatus(String classroomId, String status) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new IllegalArgumentException("Classroom not found"));
        classroom.setOperationalStatus(parseOperationalStatus(status));
        return toClassroomResponse(classroomRepository.save(classroom), null, null, null);
    }

    public List<BookingResponse> allBookings() {
        return bookingRepository.findAll().stream()
                .sorted(Comparator.comparing(FacilityBooking::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toBookingResponse)
                .toList();
    }

    public BookingResponse updateBookingStatus(
            String bookingId,
            UpdateBookingStatusRequest request,
            User actor,
            String ipAddress,
            String userAgent,
            String sessionId) {
        FacilityBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        BookingStatus previousStatus = booking.getStatus();
        BookingStatus nextStatus = parseBookingStatus(request.getStatus());

        if (nextStatus == BookingStatus.APPROVED) {
            validateNoApprovalConflict(booking);
        }

        booking.setStatus(nextStatus);
        FacilityBooking saved = bookingRepository.save(booking);

        if (nextStatus == BookingStatus.APPROVED && previousStatus != BookingStatus.APPROVED) {
            notificationService.notifyBookingApproved(saved);
        }

        if (nextStatus == BookingStatus.CANCELLED && previousStatus != BookingStatus.CANCELLED) {
            notificationService.notifyBookingCancelled(saved);
        }

        bookingAuditService.recordEvent(
                saved.getId(),
                BookingAuditType.FACILITY,
                "STATUS_UPDATED",
                previousStatus != null ? previousStatus.name() : null,
                nextStatus.name(),
                actor,
                request.getReason(),
                ipAddress,
                userAgent,
                sessionId);

        return toBookingResponse(saved);
    }

    public List<BookingAuditEventResponse> bookingAuditTimeline(String bookingId) {
        return bookingAuditService.getTimeline(bookingId, BookingAuditType.FACILITY);
    }

    public FacilityReportResponse reports() {
        return new FacilityReportResponse(
                buildingRepository.count(),
                classroomRepository.count(),
                bookingRepository.count(),
                bookingRepository.countByStatusIn(List.of(BookingStatus.PENDING)),
                classroomRepository.findAll().stream().filter(room -> room.getOperationalStatus() == FacilityOperationalStatus.UNAVAILABLE).count());
    }

        private ClassroomResponse toClassroomResponse(Classroom classroom, LocalDate date, LocalTime startTime, LocalTime endTime) {
        String status = classroom.getOperationalStatus() == FacilityOperationalStatus.UNAVAILABLE
            ? "UNAVAILABLE"
            : effectiveBookingState(classroom, date, startTime, endTime);
        return new ClassroomResponse(
                classroom.getId(),
                classroom.getRoomNumber(),
                classroom.getCapacity(),
                classroom.getType(),
                classroom.getEquipment(),
                status,
            classroom.isSeatSelectionEnabled(),
            bookedSeatsForSlot(classroom, date, startTime, endTime));
    }

        private String effectiveBookingState(Classroom classroom, LocalDate date, LocalTime startTime, LocalTime endTime) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        List<FacilityBooking> activeBookings = bookingRepository.findByClassroomIdAndBookingDate(classroom.getId(), targetDate).stream()
                .filter(booking -> booking.getStatus() == BookingStatus.PENDING || booking.getStatus() == BookingStatus.APPROVED)
            .filter(booking -> startTime == null || endTime == null || overlaps(booking, startTime, endTime))
                .toList();

        if (activeBookings.isEmpty()) {
            return "AVAILABLE";
        }

        if (!classroom.isSeatSelectionEnabled()) {
            return "BOOKED";
        }

        boolean hasWholeRoomBooking = activeBookings.stream().anyMatch(booking -> booking.getSelectedSeats() == null || booking.getSelectedSeats().isEmpty());
        if (hasWholeRoomBooking) {
            return "BOOKED";
        }

        long uniqueBookedSeats = activeBookings.stream()
                .map(FacilityBooking::getSelectedSeats)
                .filter(seats -> seats != null)
                .flatMap(List::stream)
                .distinct()
                .count();

        return uniqueBookedSeats >= classroom.getCapacity() ? "BOOKED" : "PARTIALLY_BOOKED";
    }

    private List<Integer> bookedSeatsForSlot(Classroom classroom, LocalDate date, LocalTime startTime, LocalTime endTime) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return bookingRepository.findByClassroomIdAndBookingDate(classroom.getId(), targetDate).stream()
                .filter(booking -> booking.getStatus() == BookingStatus.PENDING || booking.getStatus() == BookingStatus.APPROVED)
                .filter(booking -> startTime == null || endTime == null || overlaps(booking, startTime, endTime))
                .map(FacilityBooking::getSelectedSeats)
                .filter(seats -> seats != null)
                .flatMap(List::stream)
                .distinct()
                .sorted()
                .toList();
    }

    private BookingResponse toBookingResponse(FacilityBooking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getBuildingId(),
                booking.getBuildingName(),
                booking.getClassroomId(),
                booking.getFloorNumber(),
                booking.getRoomNumber(),
                booking.getUserId(),
                formatDate(booking.getBookingDate()),
                formatTime(booking.getStartTime()),
                formatTime(booking.getEndTime()),
                booking.getStatus() != null ? booking.getStatus().name() : "UNKNOWN",
                booking.getRequestedByName(),
                booking.getSelectedSeats(),
                booking.getPurpose(),
                booking.getPriority(),
                booking.isReviewRequired(),
                booking.getDecisionNote(),
                booking.getCreatedAt() != null ? booking.getCreatedAt().toString() : "");
    }

    private String formatDate(LocalDate value) {
        return value != null ? value.toString() : "";
    }

    private String formatTime(LocalTime value) {
        return value != null ? value.toString() : "";
    }

    private void enforceWeeklyBookingLimit(String userId, LocalDate bookingDate) {
        LocalDate start = bookingDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate end = bookingDate.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        long bookedCount = bookingRepository.countByUserIdAndBookingDateBetween(userId, start, end);
        if (bookedCount >= 3) {
            throw new IllegalArgumentException("You can book a maximum of 3 facilities per week");
        }
    }

    private boolean shouldAutoApprove(Classroom classroom, CreateBookingRequest request, List<Integer> selectedSeats) {
        boolean urgent = isUrgent(request.getPriority());
        boolean peakTime = isPeakTime(request.getStartTime(), request.getEndTime());
        long seatDemand = bookingRepository.findByClassroomIdAndBookingDate(classroom.getId(), request.getBookingDate()).stream()
                .filter(existing -> existing.getStatus() == BookingStatus.PENDING || existing.getStatus() == BookingStatus.APPROVED)
                .filter(existing -> overlaps(existing, request))
                .map(FacilityBooking::getSelectedSeats)
                .filter(seats -> seats != null)
                .flatMap(List::stream)
                .distinct()
                .count();

        return !urgent && !peakTime && seatDemand < Math.max(2, classroom.getCapacity() / 4L)
                && selectedSeats.size() <= Math.max(2, classroom.getCapacity() / 3);
    }

    private boolean isUrgent(String priority) {
        return StringUtils.hasText(priority) && priority.trim().equalsIgnoreCase("urgent");
    }

    private String normalizePriority(String priority) {
        return StringUtils.hasText(priority) ? priority.trim().toUpperCase(Locale.ROOT) : "NORMAL";
    }

    private String normalizeText(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }

    private boolean isPeakTime(LocalTime startTime, LocalTime endTime) {
        return (startTime != null && !startTime.isBefore(LocalTime.of(11, 0)) && startTime.isBefore(LocalTime.of(15, 0)))
                || (endTime != null && endTime.isAfter(LocalTime.of(11, 0)) && !endTime.isAfter(LocalTime.of(16, 0)));
    }

    private String buildReviewNote(Classroom classroom, CreateBookingRequest request) {
        if (isUrgent(request.getPriority())) {
            return "Marked for review because it is urgent";
        }
        if (isPeakTime(request.getStartTime(), request.getEndTime())) {
            return "Marked for review because this is a peak-time request";
        }
        if (StringUtils.hasText(request.getPurpose()) && request.getPurpose().trim().equalsIgnoreCase("event") && classroom.getCapacity() > 40) {
            return "Marked for review because this is a large event request";
        }
        return "Marked for review by booking logic";
    }

    private boolean overlaps(FacilityBooking existing, CreateBookingRequest request) {
        return request.getStartTime().isBefore(existing.getEndTime())
                && request.getEndTime().isAfter(existing.getStartTime());
    }

    private boolean overlaps(FacilityBooking existing, LocalTime startTime, LocalTime endTime) {
        return startTime.isBefore(existing.getEndTime()) && endTime.isAfter(existing.getStartTime());
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

    private void validateSeatAvailability(String classroomId, LocalDate bookingDate, LocalTime startTime, LocalTime endTime, List<Integer> selectedSeats) {
        Set<Integer> bookedSeats = collectBookedSeats(classroomId, bookingDate, startTime, endTime, null);

        List<Integer> conflicts = selectedSeats.stream().filter(bookedSeats::contains).toList();
        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException("Seat(s) " + conflicts + " are not available for the selected time slot");
        }
    }

    private void validateWholeRoomAvailability(String classroomId, LocalDate bookingDate, LocalTime startTime, LocalTime endTime, String ignoreBookingId) {
        List<FacilityBooking> conflicts = bookingRepository.findByClassroomIdAndBookingDate(classroomId, bookingDate).stream()
                .filter(booking -> booking.getStatus() == BookingStatus.PENDING || booking.getStatus() == BookingStatus.APPROVED)
                .filter(booking -> ignoreBookingId == null || !ignoreBookingId.equals(booking.getId()))
                .filter(booking -> overlaps(booking, startTime, endTime))
                .toList();

        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException("Selected time slot is already booked");
        }
    }

    private Set<Integer> collectBookedSeats(String classroomId, LocalDate bookingDate, LocalTime startTime, LocalTime endTime, String ignoreBookingId) {
        List<FacilityBooking> bookings = bookingRepository.findByClassroomIdAndBookingDate(classroomId, bookingDate);
        Set<Integer> bookedSeats = new LinkedHashSet<>();

        for (FacilityBooking booking : bookings) {
            if ((booking.getStatus() == BookingStatus.PENDING || booking.getStatus() == BookingStatus.APPROVED) &&
                    (ignoreBookingId == null || !ignoreBookingId.equals(booking.getId())) &&
                    overlaps(booking, startTime, endTime)) {
                if (booking.getSelectedSeats() != null && !booking.getSelectedSeats().isEmpty()) {
                    bookedSeats.addAll(booking.getSelectedSeats());
                } else {
                    throw new IllegalArgumentException("This room is already booked for the selected time slot");
                }
            }
        }

        return bookedSeats;
    }

    private void validateNoApprovalConflict(FacilityBooking booking) {
        if (booking.getBookingDate() == null || booking.getStartTime() == null || booking.getEndTime() == null) {
            return;
        }

        List<FacilityBooking> conflicts = bookingRepository.findByClassroomIdAndBookingDate(booking.getClassroomId(), booking.getBookingDate()).stream()
                .filter(existing -> !booking.getId().equals(existing.getId()))
                .filter(existing -> existing.getStatus() == BookingStatus.PENDING || existing.getStatus() == BookingStatus.APPROVED)
                .filter(existing -> overlaps(existing, booking.getStartTime(), booking.getEndTime()))
                .filter(existing -> {
                    if (booking.getSelectedSeats() == null || booking.getSelectedSeats().isEmpty() || existing.getSelectedSeats() == null || existing.getSelectedSeats().isEmpty()) {
                        return true;
                    }
                    return existing.getSelectedSeats().stream().anyMatch(booking.getSelectedSeats()::contains);
                })
                .toList();

        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException("This booking conflicts with an existing reservation");
        }
    }
}
