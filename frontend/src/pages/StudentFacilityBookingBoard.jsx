import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import StudentPortalShell from "../components/StudentPortalShell";
import {
  createFacilityBooking,
  fetchFloorClassrooms,
  fetchStudentBookings,
  fetchStudentFacilitiesOverview,
} from "../services/facilities";
import { readApiError } from "../services/api";

function StudentFacilityBookingBoard() {
  const { buildingId, floorNumber } = useParams();
  const [buildingName, setBuildingName] = useState("Building");
  const [classrooms, setClassrooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomFilter, setRoomFilter] = useState("all");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const statusLegend = useMemo(
    () => [
      { label: "Available", tone: "available" },
      { label: "Booked", tone: "booked" },
      { label: "Unavailable", tone: "unavailable" },
    ],
    []
  );

  const normalizeRoomType = (room) => (room.type || "").toLowerCase().includes("lab") ? "Lab" : "Lecture Room";

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

  const loadPage = async (selectedDate) => {
    try {
      setError("");
      const [overview, classroomData, bookingData] = await Promise.all([
        fetchStudentFacilitiesOverview(),
        fetchFloorClassrooms(buildingId, floorNumber, selectedDate),
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
    loadPage(date);
  }, [buildingId, floorNumber, date]);

  useEffect(() => {
    setSelectedRoom((current) => filteredClassrooms.find((room) => room.id === current?.id) || filteredClassrooms[0] || null);
  }, [filteredClassrooms]);

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
      });
      await loadPage(date);
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StudentPortalShell activeKey="facilities">
      <section className="facility-booking-board">
        <div className="facility-booking-board-top">
          <div>
            <Link className="facility-booking-back" to={`/student/facilities/buildings/${buildingId}`}>
              {"< Back to Floors"}
            </Link>
            <h2 className="facility-booking-title">{buildingName} | Floor {floorNumber}</h2>
            <p className="facility-booking-subtitle">
              Pick a date, review live room status, and book an available classroom.
            </p>
          </div>

          <div className="facility-booking-legend" aria-label="Booking status legend">
            {statusLegend.map((item) => (
              <span key={item.label} className="facility-booking-legend-item">
                <span className={`facility-booking-legend-dot facility-booking-legend-dot-${item.tone}`} />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        <div className="facility-booking-controls">
          <div className="student-facility-field">
            <label>Date</label>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>
          <div className="student-facility-field">
            <label>Start Time</label>
            <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
          </div>
          <div className="student-facility-field">
            <label>End Time</label>
            <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
          </div>
          <div className="student-facility-field facility-booking-filter-field">
            <label>Room Type</label>
            <div className="facility-booking-filter-chips">
              <button
                className={`facility-booking-filter-chip${roomFilter === "all" ? " facility-booking-filter-chip-active" : ""}`}
                type="button"
                onClick={() => setRoomFilter("all")}
              >
                All Rooms
              </button>
              <button
                className={`facility-booking-filter-chip${roomFilter === "lecture" ? " facility-booking-filter-chip-active" : ""}`}
                type="button"
                onClick={() => setRoomFilter("lecture")}
              >
                Lecture Rooms
              </button>
              <button
                className={`facility-booking-filter-chip${roomFilter === "lab" ? " facility-booking-filter-chip-active" : ""}`}
                type="button"
                onClick={() => setRoomFilter("lab")}
              >
                Labs
              </button>
            </div>
          </div>
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        <div className="facility-booking-layout">
          <section className="facility-booking-floor-sections">
            <section className="facility-booking-floor">
              <div className="facility-booking-floor-head">
                <span aria-hidden="true">[]</span>
                <span aria-hidden="true">#</span>
                <h3>Classrooms</h3>
              </div>

              {loading ? (
                <p className="helper-text">Loading classrooms...</p>
              ) : filteredClassrooms.length === 0 ? (
                <p className="helper-text">No rooms match the selected filter on this floor.</p>
              ) : classrooms.length === 0 ? (
                <p className="helper-text">No classrooms are listed for this floor yet.</p>
              ) : (
                <div className="facility-booking-room-grid">
                  {filteredClassrooms.map((room) => (
                    <button
                      key={room.id}
                      className={`facility-booking-room-card${selectedRoom?.id === room.id ? " facility-booking-room-card-active" : ""}`}
                      type="button"
                      onClick={() => setSelectedRoom(room)}
                    >
                      <div className="facility-booking-room-card-top">
                        <strong>{room.roomNumber}</strong>
                        <span className="facility-booking-room-type">{normalizeRoomType(room)}</span>
                      </div>
                      <span>Capacity: {room.capacity}</span>
                      <em className={`facility-booking-room-status facility-booking-room-status-${room.status.toLowerCase()}`}>
                        {room.status.charAt(0) + room.status.slice(1).toLowerCase()}
                      </em>
                      <div className="facility-booking-room-equipment">
                        {(room.equipment || []).slice(0, 3).map((item) => (
                          <span key={item}>{item}</span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </section>

          <aside className="facility-booking-detail-panel">
            <div className="facility-booking-detail-card">
              <h3>Classroom Details</h3>
              {selectedRoom ? (
                <>
                  <p><strong>Room:</strong> {selectedRoom.roomNumber}</p>
                  <p><strong>Capacity:</strong> {selectedRoom.capacity}</p>
                  <p><strong>Type:</strong> {normalizeRoomType(selectedRoom)}</p>
                  <p><strong>Status:</strong> {selectedRoom.status}</p>
                  <div className="student-facility-equipment">
                    {(selectedRoom.equipment || []).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                  <button
                    className="solid-btn full-width"
                    type="button"
                    disabled={selectedRoom.status !== "AVAILABLE" || submitting}
                    onClick={onBook}
                  >
                    {submitting ? "Booking..." : "Book Classroom"}
                  </button>
                </>
              ) : (
                <p className="helper-text">Select a classroom to view details.</p>
              )}
            </div>

            <div className="facility-booking-detail-card">
              <h3>My Bookings</h3>
              <ul className="list-clean student-modern-mini-list">
                {bookings.length ? (
                  bookings.map((booking) => (
                    <li key={booking.id}>
                      {booking.roomNumber} | {booking.bookingDate} | {booking.startTime} - {booking.endTime} | {booking.status}
                    </li>
                  ))
                ) : (
                  <li>No bookings yet.</li>
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
