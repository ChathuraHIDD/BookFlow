import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import StudentPortalShell from "../components/StudentPortalShell";
import SeatSelector from "../components/SeatSelector";
import {
  createFacilityBooking,
  fetchFloorClassrooms,
  fetchStudentBookings,
  fetchStudentFacilitiesOverview,
} from "../services/facilities";
import { readApiError } from "../services/api";

const STEP_LABELS = ["Select Facility", "Pick Time", "Purpose & Priority", "Review & Book"];
const PURPOSE_OPTIONS = [
  { value: "Study", label: "Study", icon: "📚", description: "Individual or group study session" },
  { value: "Meeting", label: "Meeting", icon: "🤝", description: "Team meetings or discussions" },
  { value: "Event", label: "Event", icon: "🎉", description: "Workshops, presentations, or events" }
];
const PRIORITY_OPTIONS = [
  { value: "NORMAL", label: "Normal", icon: "⏰", description: "Standard processing time" },
  { value: "URGENT", label: "Urgent", icon: "🔥", description: "Priority review and approval" },
];
const QUICK_SLOTS = [
  { label: "Less crowded morning", start: "08:00", end: "10:00", icon: "🌅", description: "Quiet morning hours" },
  { label: "Balanced midday", start: "10:30", end: "12:30", icon: "⚖️", description: "Optimal balance" },
  { label: "Quiet afternoon", start: "14:00", end: "16:00", icon: "🌤️", description: "Peaceful afternoon" },
];

function StudentFacilityBookingBoard() {
  const { buildingId, floorNumber } = useParams();
  const [buildingName, setBuildingName] = useState("Building");
  const [classrooms, setClassrooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [roomFilter, setRoomFilter] = useState("all");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [purpose, setPurpose] = useState("Study");
  const [priority, setPriority] = useState("NORMAL");
  const [bookingStep, setBookingStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const statusLegend = useMemo(
    () => [
      { label: "Available", tone: "available" },
      { label: "Partially booked", tone: "booked" },
      { label: "Unavailable", tone: "unavailable" },
    ],
    []
  );

  const normalizeRoomType = (room) => ((room.type || "").toLowerCase().includes("lab") ? "Lab" : "Lecture Room");

  const filteredClassrooms = useMemo(() => {
    return classrooms.filter((room) => {
      const roomType = normalizeRoomType(room);
      if (roomFilter === "lab") {
        return roomType === "Lab";
      }
      if (roomFilter === "lecture") {
        return roomType === "Lecture Room";
      }
      return true;
    });
  }, [classrooms, roomFilter]);

  const highestDemandRoomId = useMemo(() => {
    if (!filteredClassrooms.length) {
      return null;
    }

    return filteredClassrooms.reduce((bestId, room) => {
      const bestRoom = filteredClassrooms.find((item) => item.id === bestId);
      const roomLoad = (room.bookedSeats?.length || 0) / Math.max(room.capacity || 1, 1);
      const bestLoad = (bestRoom?.bookedSeats?.length || 0) / Math.max(bestRoom?.capacity || 1, 1);
      return roomLoad > bestLoad ? room.id : bestId;
    }, filteredClassrooms[0].id);
  }, [filteredClassrooms]);

  const selectedRoomLoad = useMemo(() => {
    if (!selectedRoom) {
      return 0;
    }
    return (selectedRoom.bookedSeats?.length || 0) / Math.max(selectedRoom.capacity || 1, 1);
  }, [selectedRoom]);

  const weeklyBookingCount = useMemo(() => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.bookingDate);
      if (Number.isNaN(bookingDate.getTime())) {
        return false;
      }
      const status = (booking.status || "").toUpperCase();
      return bookingDate >= startOfWeek && bookingDate <= endOfWeek && status !== "CANCELLED" && status !== "REJECTED";
    }).length;
  }, [bookings, date]);

  const smartSuggestions = useMemo(() => {
    return QUICK_SLOTS.map((slot, index) => {
      const busy = selectedRoomLoad > 0.45 && index === 1;
      return {
        ...slot,
        label: busy ? `${slot.label} · Less crowded time` : slot.label,
        variant: busy ? "recommended" : "default",
      };
    });
  }, [selectedRoomLoad]);

  const loadPage = async (selectedDate, currentStartTime, currentEndTime) => {
    try {
      setError("");
      const [overview, classroomData, bookingData] = await Promise.all([
        fetchStudentFacilitiesOverview(),
        fetchFloorClassrooms(buildingId, floorNumber, selectedDate, currentStartTime, currentEndTime),
        fetchStudentBookings(),
      ]);
      const building = overview.buildings.find((item) => item.id === buildingId);
      setBuildingName(building?.name || "Building");
      setClassrooms(classroomData);
      setBookings(bookingData);
      setSelectedRoom((current) => classroomData.find((room) => room.id === current?.id) || classroomData[0] || null);
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadPage(date, startTime, endTime);
  }, [buildingId, floorNumber, date, startTime, endTime]);

  useEffect(() => {
    setSelectedSeats([]);
  }, [selectedRoom?.id, date, startTime, endTime]);

  const isValidTimeRange = startTime < endTime;
  const canUseSeatBooking = Boolean(selectedRoom?.seatSelectionEnabled);
  const selectedRoomFullyBooked = selectedRoom?.status === "BOOKED" && selectedRoomLoad >= 1;
  const canAccessStep2 = Boolean(selectedRoom);
  const canAccessStep3 = canAccessStep2 && isValidTimeRange;
  const canAccessStep4 = canAccessStep3 && Boolean(purpose);

  const canVisitStep = (stepNumber) => {
    if (stepNumber === 1) return true;
    if (stepNumber === 2) return canAccessStep2;
    if (stepNumber === 3) return canAccessStep3;
    if (stepNumber === 4) return canAccessStep4;
    return false;
  };

  const onStepClick = (stepNumber) => {
    if (canVisitStep(stepNumber)) {
      setBookingStep(stepNumber);
    }
  };

  const goNext = () => {
    if (bookingStep === 1 && selectedRoom) {
      setBookingStep(2);
      return;
    }
    if (bookingStep === 2 && isValidTimeRange) {
      setBookingStep(3);
      return;
    }
    if (bookingStep === 3 && purpose) {
      setBookingStep(4);
    }
  };

  const goBack = () => {
    setBookingStep((current) => Math.max(1, current - 1));
  };

  const onBook = async () => {
    if (!selectedRoom) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await createFacilityBooking({
        classroomId: selectedRoom.id,
        bookingDate: date,
        startTime,
        endTime,
        selectedSeats: selectedRoom.seatSelectionEnabled ? selectedSeats : [],
        purpose,
        priority,
      });
      await loadPage(date, startTime, endTime);
      setSelectedSeats([]);
      setBookingStep(1);
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const bookingDisabled = submitting || !selectedRoom || !isValidTimeRange || (canUseSeatBooking && !selectedSeats.length) || selectedRoomFullyBooked;

  return (
    <StudentPortalShell activeKey="facilities">
      <section className="facility-booking-board facility-booking-board-smart">
        <div className="facility-booking-board-top">
          <div>
            <Link className="facility-booking-back" to={`/student/facilities/buildings/${buildingId}`}>
              <span className="back-icon">←</span>
              {" Back to Floors"}
            </Link>
            <h2 className="facility-booking-title">
              {buildingName} | Floor {floorNumber}
            </h2>
            <p className="facility-booking-subtitle">
              A guided booking flow with live seat availability, smart time hints, purpose-based priority, and auto validation.
            </p>
            <div className="booking-stats">
              <div className="stat-item">
                <span className="stat-number">{filteredClassrooms.length}</span>
                <span className="stat-label">Available Rooms</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{weeklyBookingCount}</span>
                <span className="stat-label">This Week</span>
              </div>
            </div>
          </div>

          <div className="facility-booking-legend" aria-label="Booking status legend">
            <h4 className="legend-title">Status Legend</h4>
            <div className="legend-items">
              {statusLegend.map((item) => (
                <div key={item.label} className="facility-booking-legend-item">
                  <span className={`facility-booking-legend-dot facility-booking-legend-dot-${item.tone}`} />
                  <span className="legend-text">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="facility-booking-stepper" aria-label="Booking steps">
          {STEP_LABELS.map((label, index) => (
            <button
              key={label}
              type="button"
              className={`facility-booking-step${bookingStep === index + 1 ? " facility-booking-step-active" : ""}${canVisitStep(index + 1) ? "" : " facility-booking-step-locked"}`}
              disabled={!canVisitStep(index + 1)}
              onClick={() => onStepClick(index + 1)}
            >
              <span>{index + 1}</span>
              <strong>{label}</strong>
            </button>
          ))}
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        <div className="facility-booking-layout">
          <section className="facility-booking-floor-sections">
            <section className="facility-booking-floor">
              {selectedRoom ? (
                <div className="facility-booking-context-bar">
                  <span className="context-item">🏛️ {selectedRoom.roomNumber}</span>
                  <span className="context-item">📅 {date}</span>
                  <span className="context-item">⏰ {startTime} - {endTime}</span>
                </div>
              ) : null}

              <div className="facility-booking-wizard-stage">
                {bookingStep === 1 && (
                  <>
                    <div className="facility-booking-floor-head">
                      <span aria-hidden="true">[]</span>
                      <span aria-hidden="true">#</span>
                      <h3>Step 1. Select Facility</h3>
                    </div>

                    <div className="facility-booking-filter-field">
                      <label className="filter-label">
                        <span className="filter-icon">🏢</span>
                        Room Type
                      </label>
                      <div className="facility-booking-filter-chips">
                        <button
                          className={`facility-booking-filter-chip${roomFilter === "all" ? " facility-booking-filter-chip-active" : ""}`}
                          type="button"
                          onClick={() => setRoomFilter("all")}
                        >
                          <span className="chip-icon">🏛️</span>
                          All Rooms
                          <span className="chip-count">{classrooms.length}</span>
                        </button>
                        <button
                          className={`facility-booking-filter-chip${roomFilter === "lecture" ? " facility-booking-filter-chip-active" : ""}`}
                          type="button"
                          onClick={() => setRoomFilter("lecture")}
                        >
                          <span className="chip-icon">📚</span>
                          Lecture Rooms
                          <span className="chip-count">{classrooms.filter(r => !r.type?.toLowerCase().includes("lab")).length}</span>
                        </button>
                        <button
                          className={`facility-booking-filter-chip${roomFilter === "lab" ? " facility-booking-filter-chip-active" : ""}`}
                          type="button"
                          onClick={() => setRoomFilter("lab")}
                        >
                          <span className="chip-icon">🔬</span>
                          Labs
                          <span className="chip-count">{classrooms.filter(r => r.type?.toLowerCase().includes("lab")).length}</span>
                        </button>
                      </div>
                    </div>

                    <div className="facility-booking-room-grid facility-booking-room-grid-smart">
                      {loading ? (
                        <div className="loading-state">
                          <div className="loading-spinner"></div>
                          <p className="helper-text">Loading classrooms...</p>
                        </div>
                      ) : filteredClassrooms.length === 0 ? (
                        <div className="empty-state">
                          <div className="empty-icon">🔍</div>
                          <p className="helper-text">No rooms match the selected filter on this floor.</p>
                          <button className="ghost-btn" onClick={() => setRoomFilter("all")}>Show All Rooms</button>
                        </div>
                      ) : classrooms.length === 0 ? (
                        <div className="empty-state">
                          <div className="empty-icon">🏫</div>
                          <p className="helper-text">No classrooms are listed for this floor yet.</p>
                        </div>
                      ) : (
                        filteredClassrooms.map((room, index) => {
                          const occupancy = Math.round(((room.bookedSeats?.length || 0) / Math.max(room.capacity || 1, 1)) * 100);
                          const isPopular = room.id === highestDemandRoomId && occupancy > 0;
                          const availableSeats = Math.max(room.capacity - (room.bookedSeats?.length || 0), 0);
                          return (
                            <button
                              key={room.id}
                              className={`facility-booking-room-card facility-booking-room-card-smart${selectedRoom?.id === room.id ? " facility-booking-room-card-active" : ""}`}
                              type="button"
                              onClick={() => {
                                setSelectedRoom(room);
                                setBookingStep(2);
                              }}
                              style={{ animationDelay: `${index * 0.1}s` }}
                            >
                              <div
                                className="facility-booking-room-card-media"
                                style={{ backgroundImage: `linear-gradient(180deg, rgba(18, 16, 40, 0.1), rgba(18, 16, 40, 0.74)), url('/landing/campus-building.jpg')` }}
                              >
                                <div className="room-header">
                                  <span className="facility-booking-room-type">{normalizeRoomType(room)}</span>
                                  {isPopular && <span className="facility-booking-popularity-badge">🔥 Most booked</span>}
                                </div>
                                <div className="room-occupancy-indicator">
                                  <div className="occupancy-bar">
                                    <div className="occupancy-fill" style={{ width: `${occupancy}%` }}></div>
                                  </div>
                                  <span className="occupancy-text">{occupancy}%</span>
                                </div>
                              </div>
                              <div className="facility-booking-room-card-content">
                                <div className="facility-booking-room-card-top">
                                  <strong>{room.roomNumber}</strong>
                                  <span className="capacity-info">
                                    <span className="capacity-icon">👥</span>
                                    {room.capacity} capacity
                                  </span>
                                </div>
                                <div className="room-status-section">
                                  <em className={`facility-booking-room-status facility-booking-room-status-${room.status.toLowerCase()}`}>
                                    {room.status.charAt(0) + room.status.slice(1).toLowerCase().replace("_", " ")}
                                  </em>
                                  <span className="available-seats">
                                    {availableSeats > 0 ? `${availableSeats} seats available` : "Fully booked"}
                                  </span>
                                </div>
                                <div className="facility-booking-room-equipment">
                                  {(room.equipment || []).slice(0, 3).map((item) => (
                                    <span key={item} className="equipment-tag">{item}</span>
                                  ))}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </>
                )}

                {bookingStep === 2 && (
                  <div className="facility-booking-detail-card facility-booking-step-two-card facility-booking-flow-card-active">
                    <div className="step-header">
                      <h3>Step 2. Smart Date & Time</h3>
                      <span className="step-icon">📅</span>
                    </div>
                    <div className="datetime-grid">
                      <div className="student-facility-field">
                        <label>
                          <span className="field-icon">📆</span>
                          Date
                        </label>
                        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
                      </div>
                      <div className="student-facility-field">
                        <label>
                          <span className="field-icon">⏰</span>
                          Start Time
                        </label>
                        <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
                      </div>
                      <div className="student-facility-field">
                        <label>
                          <span className="field-icon">🏁</span>
                          End Time
                        </label>
                        <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
                      </div>
                    </div>
                    <div className="facility-booking-insights">
                      <h4 className="insights-title">📊 Smart Insights</h4>
                      <div className="insights-grid">
                        <div className={`insight-item ${selectedRoomLoad > 0.45 ? "busy" : "light"}`}>
                          <div className="insight-icon">{selectedRoomLoad > 0.45 ? "⚠️" : "✅"}</div>
                          <div className="insight-content">
                            <strong>Peak signal</strong>
                            <span>{selectedRoomLoad > 0.45 ? "Busy slot detected" : "Current slot looks light"}</span>
                          </div>
                        </div>
                        <div className="insight-item">
                          <div className="insight-icon">📈</div>
                          <div className="insight-content">
                            <strong>Weekly usage</strong>
                            <span>{weeklyBookingCount} bookings this week</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="facility-booking-suggestions">
                      <h4 className="suggestions-title">💡 Smart Suggestions</h4>
                      <div className="suggestions-grid">
                        {smartSuggestions.map((slot) => (
                          <button
                            key={slot.label}
                            type="button"
                            className={`facility-booking-suggestion-chip${slot.variant === "recommended" ? " facility-booking-suggestion-chip-recommended" : ""}`}
                            onClick={() => {
                              setStartTime(slot.start);
                              setEndTime(slot.end);
                              setBookingStep(3);
                            }}
                          >
                            <div className="suggestion-header">
                              <span className="suggestion-icon">{slot.icon}</span>
                              <strong>{slot.label}</strong>
                              {slot.variant === "recommended" && <span className="recommended-badge">Recommended</span>}
                            </div>
                            <span className="suggestion-time">{slot.start} - {slot.end}</span>
                            <span className="suggestion-description">{slot.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="facility-booking-summary-note">
                      {isValidTimeRange ? "Selected time is valid." : "End time must be later than start time."}
                    </div>
                  </div>
                )}

                {bookingStep === 3 && (
                  <div className="facility-booking-detail-card facility-booking-flow-card facility-booking-flow-card-active">
                    <div className="step-header">
                      <h3>Step 3. Purpose + Priority</h3>
                      <span className="step-icon">🎯</span>
                    </div>
                    <div className="purpose-priority-section">
                      <div className="choice-section">
                        <h4 className="choice-title">Purpose</h4>
                        <div className="facility-booking-choice-group">
                          {PURPOSE_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={`facility-booking-choice${purpose === option.value ? " facility-booking-choice-active" : ""}`}
                              onClick={() => {
                                setPurpose(option.value);
                                setBookingStep(4);
                              }}
                            >
                              <span className="choice-icon">{option.icon}</span>
                              <div className="choice-content">
                                <strong>{option.label}</strong>
                                <span className="choice-description">{option.description}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="choice-section">
                        <h4 className="choice-title">Priority Level</h4>
                        <div className="facility-booking-choice-group">
                          {PRIORITY_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={`facility-booking-choice${priority === option.value ? " facility-booking-choice-active" : ""}`}
                              onClick={() => setPriority(option.value)}
                            >
                              <span className="choice-icon">{option.icon}</span>
                              <div className="choice-content">
                                <strong>{option.label}</strong>
                                <span className="choice-description">{option.description}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="priority-info">
                      <div className="info-icon">ℹ️</div>
                      <p className="helper-text">Urgent requests go to review first. Normal requests are auto-approved when demand is low.</p>
                    </div>
                  </div>
                )}

                {bookingStep === 4 && (
                  <div className="facility-booking-detail-card facility-booking-flow-card facility-booking-flow-card-active">
                    <div className="step-header">
                      <h3>Step 4. Review & Confirm</h3>
                      <span className="step-icon">✅</span>
                    </div>
                    {selectedRoom ? (
                      <>
                        <div className="booking-review">
                          <h4 className="review-title">📋 Booking Summary</h4>
                          <div className="review-grid">
                            <div className="review-item">
                              <span className="review-icon">🏛️</span>
                              <div className="review-content">
                                <strong>Room</strong>
                                <span>{selectedRoom.roomNumber}</span>
                              </div>
                            </div>
                            <div className="review-item">
                              <span className="review-icon">📅</span>
                              <div className="review-content">
                                <strong>Date & Time</strong>
                                <span>{date} | {startTime} - {endTime}</span>
                              </div>
                            </div>
                            <div className="review-item">
                              <span className="review-icon">🎯</span>
                              <div className="review-content">
                                <strong>Purpose</strong>
                                <span>{PURPOSE_OPTIONS.find(p => p.value === purpose)?.label || purpose}</span>
                              </div>
                            </div>
                            <div className="review-item">
                              <span className="review-icon">⚡</span>
                              <div className="review-content">
                                <strong>Priority</strong>
                                <span>{PRIORITY_OPTIONS.find(p => p.value === priority)?.label || priority}</span>
                              </div>
                            </div>
                          </div>
                          <div className="booking-decision">
                            <div className={`decision-badge ${priority === "URGENT" || selectedRoomLoad > 0.45 ? "review" : "auto"}`}>
                              <span className="decision-icon">{priority === "URGENT" || selectedRoomLoad > 0.45 ? "⏳" : "⚡"}</span>
                              <span className="decision-text">
                                {priority === "URGENT" || selectedRoomLoad > 0.45 ? "Review needed" : "Auto approval likely"}
                              </span>
                            </div>
                          </div>
                          <div className="equipment-section">
                            <h5 className="equipment-title">🛠️ Available Equipment</h5>
                            <div className="student-facility-equipment">
                              {(selectedRoom.equipment || []).map((item) => (
                                <span key={item} className="equipment-tag">{item}</span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {selectedRoom.seatSelectionEnabled ? (
                          <SeatSelector
                            classroom={selectedRoom}
                            bookedSeats={selectedRoom.bookedSeats || []}
                            onSeatsSelected={setSelectedSeats}
                          />
                        ) : null}

                        <div className="facility-booking-review-box">
                          <h4 className="validation-title">✅ Validation Check</h4>
                          <div className="validation-items">
                            <div className="validation-item">
                              <span className="validation-icon">{selectedRoom.seatSelectionEnabled ? "💺" : "🏛️"}</span>
                              <span>{selectedRoom.seatSelectionEnabled ? `${selectedSeats.length} seat(s) selected` : "Whole room booking"}</span>
                            </div>
                            <div className={`validation-item ${weeklyBookingCount < 3 ? "valid" : "warning"}`}>
                              <span className="validation-icon">{weeklyBookingCount < 3 ? "✅" : "⚠️"}</span>
                              <span>{weeklyBookingCount < 3 ? "Within weekly booking limit" : "Weekly booking limit reached"}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          className="solid-btn full-width booking-submit-btn"
                          type="button"
                          disabled={bookingDisabled}
                          onClick={onBook}
                        >
                          <span className="btn-icon">{submitting ? "⏳" : selectedRoomFullyBooked ? "❌" : selectedRoomLoad > 0.45 ? "⏰" : "✅"}</span>
                          <span className="btn-text">
                            {submitting ? "Submitting..." : selectedRoomFullyBooked ? "Room full" : selectedRoomLoad > 0.45 ? "Send for Review" : "Book Classroom"}
                          </span>
                        </button>
                        {!selectedRoom.seatSelectionEnabled ? (
                          <p className="helper-text">Seat selection is disabled for this room. The whole classroom will be reserved.</p>
                        ) : null}
                      </>
                    ) : (
                      <p className="helper-text">Select a classroom to continue.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="facility-booking-wizard-actions">
                <button className="ghost-btn" type="button" onClick={goBack} disabled={bookingStep === 1}>
                  Back
                </button>
                <button
                  className="solid-btn"
                  type="button"
                  onClick={goNext}
                  disabled={(bookingStep === 1 && !selectedRoom) || (bookingStep === 2 && !isValidTimeRange) || bookingStep === 4}
                >
                  Next Step
                </button>
              </div>
            </section>
          </section>

          <aside className="facility-booking-detail-panel">
            <div className="facility-booking-detail-card">
              <div className="step-header">
                <h3>My Bookings</h3>
                <span className="step-icon">📚</span>
              </div>
              <ul className="list-clean student-modern-mini-list facility-booking-my-list">
                {bookings.length ? (
                  bookings.map((booking) => (
                    <li key={booking.id} className="facility-booking-my-item">
                      <div className="booking-item-header">
                        <div className="facility-booking-my-primary">
                          <span className="room-icon">🏛️</span>
                          {booking.roomNumber}
                        </div>
                        <div className="booking-datetime">
                          <span className="date-icon">📅</span>
                          {booking.bookingDate}
                        </div>
                        <div className="booking-time">
                          <span className="time-icon">⏰</span>
                          {booking.startTime} - {booking.endTime}
                        </div>
                      </div>
                      <div className="booking-item-meta">
                        <div className="facility-booking-my-meta">
                          <span className="meta-item">
                            <span className="meta-icon">🎯</span>
                            {booking.purpose || "Study"}
                          </span>
                          <span className="meta-item">
                            <span className="meta-icon">⚡</span>
                            {booking.priority || "NORMAL"}
                          </span>
                          <span className={`meta-item status-${booking.status?.toLowerCase()}`}>
                            <span className="meta-icon">📊</span>
                            {booking.reviewRequired ? "Review needed" : booking.status}
                          </span>
                        </div>
                        {booking.selectedSeats && booking.selectedSeats.length > 0 && (
                          <div className="facility-booking-my-seats">
                            <span className="seats-icon">💺</span>
                            Seats: {booking.selectedSeats.join(", ")}
                          </div>
                        )}
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="empty-bookings">
                    <div className="empty-icon">📋</div>
                    <span>No bookings yet.</span>
                  </li>
                )}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </StudentPortalShell>
  );
}

export default StudentFacilityBookingBoard;
