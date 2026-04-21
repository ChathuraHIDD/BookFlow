import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

import StudentPortalShell from "../components/StudentPortalShell";
import { createResourceBooking, fetchResourceBySlug } from "../services/resources";

function StudentResourceBooking() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  useEffect(() => {
    const loadResource = async () => {
      try {
        setLoading(true);
        const data = await fetchResourceBySlug(slug);
        setResource(data);
      } catch (err) {
        console.error("Failed to fetch resource:", err);
        setError("Could not load resource details. It may not exist.");
      } finally {
        setLoading(false);
      }
    };
    loadResource();
  }, [slug]);

  const handleBook = async () => {
    if (!resource) return;

    try {
      setSubmitting(true);
      setError("");
      await createResourceBooking({
        resourceId: resource.id,
        bookingDate: date,
        startTime,
        endTime,
      });
      // Redirect to facilities page (My Bookings tab)
      navigate("/student/facilities");
    } catch (err) {
      console.error("Booking failed:", err);
      const msg = err.response?.data?.message || err.message || "Failed to create booking.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <StudentPortalShell activeKey="facilities">
        <div className="page-wrap center-screen">
          <p>Loading resource details...</p>
        </div>
      </StudentPortalShell>
    );
  }

  if (error || !resource) {
    return (
      <StudentPortalShell activeKey="facilities">
        <div className="page-wrap center-screen">
          <p className="error-text">{error || "Resource not found."}</p>
          <Link to="/student/facilities">Return to Catalog</Link>
        </div>
      </StudentPortalShell>
    );
  }

  return (
    <StudentPortalShell activeKey="facilities">
      <section className="student-modern-hero-card student-facilities-hero">
        <div className="student-modern-hero-copy">
          <p className="student-modern-section-label">{resource.category}</p>
          <h2>{resource.name}</h2>
          <p>{resource.description}</p>
        </div>
      </section>

      <div className="student-facility-breadcrumb">
        <Link to="/student/facilities">{"< Back to Catalog"}</Link>
      </div>

      <div className="facility-booking-layout">
        <section className="facility-booking-floor-sections">
          <div className="facility-booking-detail-card">
            <h3>Locations</h3>
            <ul className="student-modern-mini-list">
              {(resource.locations || []).map((loc, idx) => (
                <li key={idx}>{loc}</li>
              ))}
            </ul>

            <h3 style={{ marginTop: "1.5rem" }}>Included Equipment / Features</h3>
            <div className="student-facility-equipment">
              {(resource.equipment || []).map((item, idx) => (
                <span key={idx}>{item}</span>
              ))}
            </div>
          </div>
        </section>

        <aside className="facility-booking-detail-panel">
          <div className="facility-booking-detail-card">
            <h3>Book This Resource</h3>
            <p className="helper-text">
              Status: <strong className={`facility-booking-room-status facility-booking-room-status-${resource.operationalStatus.toLowerCase()}`}>
                {resource.operationalStatus}
              </strong>
            </p>
            {error && <p className="error-text" style={{ marginBottom: "1rem" }}>{error}</p>}

            <div className="student-facility-field">
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="student-facility-field">
              <label>Start Time</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="student-facility-field">
              <label>End Time</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>

            <button
              className="solid-btn full-width"
              type="button"
              disabled={resource.operationalStatus !== "AVAILABLE" || submitting}
              onClick={handleBook}
              style={{ marginTop: "1rem" }}
            >
              {submitting ? "Booking..." : "Book Resource"}
            </button>
          </div>
        </aside>
      </div>
    </StudentPortalShell>
  );
}

export default StudentResourceBooking;
