import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import StudentPortalShell from "../components/StudentPortalShell";
import { fetchStudentFacilitiesOverview } from "../services/facilities";
import { readApiError } from "../services/api";

function StudentFacilities() {
  const [overview, setOverview] = useState({ buildings: [], myBookings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const data = await fetchStudentFacilitiesOverview();
        setOverview(data);
      } catch (err) {
        setError(readApiError(err));
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  return (
    <StudentPortalShell activeKey="facilities">
      <section className="student-modern-hero-card student-facilities-hero">
        <div className="student-modern-hero-copy">
          <p className="student-modern-section-label">Facilities</p>
          <h2>Select a building to start your booking.</h2>
          <p>
            Choose a building, open a floor, then pick an available classroom to reserve.
          </p>
        </div>
      </section>

      {error ? <p className="error-text">{error}</p> : null}

      <section className="student-facilities-grid">
        <article className="student-modern-workspace-card student-facilities-wide-card">
          <div className="student-modern-card-head">
            <div>
              <p className="student-modern-section-label">Buildings</p>
              <h3>Building Selection</h3>
            </div>
          </div>

          {loading ? (
            <p className="helper-text">Loading buildings...</p>
          ) : (
            <div className="student-building-card-grid">
              {overview.buildings.map((building) => (
                <Link
                  key={building.id}
                  className="student-building-card"
                  to={`/student/facilities/buildings/${building.id}`}
                >
                  <strong>{building.name}</strong>
                  <span>{building.floorCount} floors</span>
                  <span>{building.classroomCount} classrooms</span>
                </Link>
              ))}
            </div>
          )}
        </article>

        <article className="student-modern-workspace-card student-facilities-wide-card">
          <div className="student-modern-card-head">
            <div>
              <p className="student-modern-section-label">My Bookings</p>
              <h3>Booking History</h3>
            </div>
          </div>

          {loading ? (
            <p className="helper-text">Loading bookings...</p>
          ) : (
            <ul className="list-clean student-modern-mini-list">
              {overview.myBookings.length ? (
                overview.myBookings.map((booking) => (
                  <li key={booking.id}>
                    {booking.buildingName} | Floor {booking.floorNumber} | {booking.roomNumber} | {booking.bookingDate} | {booking.startTime} - {booking.endTime} | {booking.status}
                  </li>
                ))
              ) : (
                <li>No bookings yet.</li>
              )}
            </ul>
          )}
        </article>
      </section>
    </StudentPortalShell>
  );
}

export default StudentFacilities;
