import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import StudentPortalShell from "../components/StudentPortalShell";
import { fetchStudentFacilitiesOverview } from "../services/facilities";
import { readApiError } from "../services/api";
import { facilityCategoryGrid } from "../data/facilityCatalog";

function StudentFacilities() {
  const [overview, setOverview] = useState({ buildings: [], myBookings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const buildBadge = (building) => {
    const code = building?.code?.trim();
    if (code) {
      return code.slice(0, 2).toUpperCase();
    }

    return (building?.name || "B")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  };

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

  const allBookings = overview.myBookings || [];
  const approvedCount = allBookings.filter((booking) => booking.status === "APPROVED").length;
  const rejectedCount = allBookings.filter((booking) => booking.status === "REJECTED").length;

  const filteredBookings = allBookings
    .filter((booking) => {
      const bookingDate = booking.bookingDate || "";
      const status = (booking.status || "").toUpperCase();

      if (monthFilter && !bookingDate.startsWith(monthFilter)) {
        return false;
      }

      if (dateFilter && bookingDate !== dateFilter) {
        return false;
      }

      if (statusFilter !== "ALL" && status !== statusFilter) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const left = `${b.bookingDate || ""} ${b.startTime || ""}`;
      const right = `${a.bookingDate || ""} ${a.startTime || ""}`;
      return left.localeCompare(right);
    });

  const statusTone = (status) => {
    const normalized = (status || "").toLowerCase();
    if (normalized === "approved") {
      return "approved";
    }
    if (normalized === "rejected") {
      return "rejected";
    }
    if (normalized === "pending") {
      return "pending";
    }
    if (normalized === "cancelled") {
      return "cancelled";
    }
    return "default";
  };

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
                  <div className="student-building-card-visual" aria-hidden="true">
                    <span className="student-building-card-icon">{buildBadge(building)}</span>
                  </div>
                  <strong>{building.name}</strong>
                  <div className="student-building-card-meta">
                    <span>{building.floorCount} floors</span>
                    <span>{building.classroomCount} classrooms</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="student-facility-catalog-divider" />

          <div className="student-modern-card-head student-facility-catalog-head">
            <div>
              <p className="student-modern-section-label">Catalogue</p>
              <h3>Facilities Catalogue</h3>
            </div>
            <p className="helper-text">Select a category to open its sub parts page.</p>
          </div>

          <div className="student-facility-catalog-grid" aria-label="Facility categories">
            {facilityCategoryGrid.map((category) => (
              <Link
                key={category.slug}
                className="student-facility-catalog-card"
                to={`/student/facilities/categories/${category.slug}`}
                style={{ "--facility-accent": category.accent }}
              >
                <strong>{category.name}</strong>
              </Link>
            ))}
          </div>
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
            <>
              <div className="student-booking-stat-grid">
                <article className="student-booking-stat-card student-booking-stat-card-total">
                  <p>Total Bookings</p>
                  <strong>{allBookings.length}</strong>
                  <span>All requests</span>
                </article>
                <article className="student-booking-stat-card student-booking-stat-card-approved">
                  <p>Approved</p>
                  <strong>{approvedCount}</strong>
                  <span>Confirmed by admin</span>
                </article>
                <article className="student-booking-stat-card student-booking-stat-card-rejected">
                  <p>Rejected</p>
                  <strong>{rejectedCount}</strong>
                  <span>Not approved</span>
                </article>
              </div>

              <div className="student-booking-filter-bar">
                <label>
                  Month
                  <input
                    type="month"
                    value={monthFilter}
                    onChange={(event) => setMonthFilter(event.target.value)}
                  />
                </label>

                <label>
                  Date
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(event) => setDateFilter(event.target.value)}
                  />
                </label>

                <label>
                  Status
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="ALL">All</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="PENDING">Pending</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </label>
              </div>

              <ul className="list-clean student-booking-history-list">
                {filteredBookings.length ? (
                  filteredBookings.map((booking) => (
                    <li key={booking.id} className="student-booking-history-card">
                      <div className="student-booking-history-top">
                        <strong>{booking.buildingName} | Floor {booking.floorNumber} | {booking.roomNumber}</strong>
                        <span className={`student-booking-status-badge student-booking-status-${statusTone(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      <p>{booking.bookingDate} | {booking.startTime} - {booking.endTime}</p>
                    </li>
                  ))
                ) : (
                  <li>No bookings match the selected filters.</li>
                )}
              </ul>
            </>
          )}
        </article>
      </section>
    </StudentPortalShell>
  );
}

export default StudentFacilities;
