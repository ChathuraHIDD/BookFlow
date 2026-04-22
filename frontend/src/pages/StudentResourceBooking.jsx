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
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading resource details...</p>
          </div>
        </div>
      </StudentPortalShell>
    );
  }

  if (error || !resource) {
    return (
      <StudentPortalShell activeKey="facilities">
        <div className="page-wrap center-screen">
          <div className="error-state">
            <div className="error-icon">❌</div>
            <p className="error-text">{error || "Resource not found."}</p>
            <Link to="/student/facilities" className="back-link">
              <span className="back-icon">←</span>
              Return to Catalog
            </Link>
          </div>
        </div>
      </StudentPortalShell>
    );
  }

  return (
    <StudentPortalShell activeKey="facilities">
      <section className="resource-booking-hero">
        <div className="hero-background">
          <div className="hero-gradient"></div>
        </div>
        <div className="hero-content">
          <div className="hero-breadcrumb">
            <Link to="/student/facilities" className="breadcrumb-link">
              <span className="breadcrumb-icon">←</span>
              Back to Catalog
            </Link>
          </div>
          <div className="hero-details">
            <div className="resource-category">
              <span className="category-icon">🏷️</span>
              {resource.category}
            </div>
            <h1 className="resource-title">{resource.name}</h1>
            <p className="resource-description">{resource.description}</p>
            <div className="resource-status">
              <div className={`status-badge ${resource.operationalStatus.toLowerCase()}`}>
                <span className="status-icon">
                  {resource.operationalStatus === 'AVAILABLE' ? '✅' : resource.operationalStatus === 'MAINTENANCE' ? '🔧' : '❌'}
                </span>
                {resource.operationalStatus}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="resource-booking-layout">
        <section className="resource-details-section">
          <div className="resource-detail-card">
            <div className="detail-header">
              <h3 className="detail-title">
                <span className="title-icon">📍</span>
                Available Locations
              </h3>
            </div>
            <div className="locations-grid">
              {(resource.locations || []).map((loc, idx) => (
                <div key={idx} className="location-item">
                  <span className="location-icon">🏢</span>
                  <span className="location-text">{loc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="resource-detail-card">
            <div className="detail-header">
              <h3 className="detail-title">
                <span className="title-icon">🛠️</span>
                Equipment & Features
              </h3>
            </div>
            <div className="equipment-grid">
              {(resource.equipment || []).map((item, idx) => (
                <div key={idx} className="equipment-item">
                  <span className="equipment-icon">⚙️</span>
                  <span className="equipment-text">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="resource-detail-card">
            <div className="detail-header">
              <h3 className="detail-title">
                <span className="title-icon">📋</span>
                Resource Information
              </h3>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Category</span>
                <span className="info-value">{resource.category}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Current Status</span>
                <span className={`info-value status-${resource.operationalStatus.toLowerCase()}`}>
                  {resource.operationalStatus}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Booking Type</span>
                <span className="info-value">Resource Reservation</span>
              </div>
            </div>
          </div>
        </section>

        <aside className="resource-booking-panel">
          <div className="booking-card">
            <div className="booking-header">
              <h3 className="booking-title">
                <span className="title-icon">📅</span>
                Book This Resource
              </h3>
              <div className="booking-status">
                <div className={`status-indicator ${resource.operationalStatus.toLowerCase()}`}>
                  <span className="indicator-icon">
                    {resource.operationalStatus === 'AVAILABLE' ? '✅' : resource.operationalStatus === 'MAINTENANCE' ? '🔧' : '❌'}
                  </span>
                  <span className="indicator-text">{resource.operationalStatus}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span className="error-text">{error}</span>
              </div>
            )}

            <div className="booking-form">
              <div className="form-section">
                <h4 className="form-section-title">
                  <span className="section-icon">📆</span>
                  Select Date & Time
                </h4>
                <div className="form-fields">
                  <div className="form-field">
                    <label className="field-label">
                      <span className="field-icon">📅</span>
                      Date
                    </label>
                    <input 
                      type="date" 
                      value={date} 
                      onChange={(e) => setDate(e.target.value)} 
                      className="form-input"
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">
                      <span className="field-icon">⏰</span>
                      Start Time
                    </label>
                    <input 
                      type="time" 
                      value={startTime} 
                      onChange={(e) => setStartTime(e.target.value)} 
                      className="form-input"
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">
                      <span className="field-icon">🏁</span>
                      End Time
                    </label>
                    <input 
                      type="time" 
                      value={endTime} 
                      onChange={(e) => setEndTime(e.target.value)} 
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="booking-summary">
                <h4 className="summary-title">
                  <span className="summary-icon">📋</span>
                  Booking Summary
                </h4>
                <div className="summary-items">
                  <div className="summary-item">
                    <span className="summary-label">Resource</span>
                    <span className="summary-value">{resource.name}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Date</span>
                    <span className="summary-value">{date}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Time</span>
                    <span className="summary-value">{startTime} - {endTime}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Duration</span>
                    <span className="summary-value">
                      {(() => {
                        const start = new Date(`1970-01-01T${startTime}`);
                        const end = new Date(`1970-01-01T${endTime}`);
                        const diff = end - start;
                        const hours = Math.floor(diff / (1000 * 60 * 60));
                        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        return `${hours}h ${minutes}m`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                className="booking-submit-btn"
                type="button"
                disabled={resource.operationalStatus !== "AVAILABLE" || submitting}
                onClick={handleBook}
              >
                <span className="btn-icon">
                  {submitting ? '⏳' : resource.operationalStatus !== "AVAILABLE" ? '❌' : '✅'}
                </span>
                <span className="btn-text">
                  {submitting ? "Processing..." : resource.operationalStatus !== "AVAILABLE" ? "Not Available" : "Book Resource"}
                </span>
              </button>

              {resource.operationalStatus !== "AVAILABLE" && (
                <div className="unavailable-message">
                  <span className="unavailable-icon">ℹ️</span>
                  <p>This resource is currently not available for booking. Please check back later or contact support.</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </StudentPortalShell>
  );
}

export default StudentResourceBooking;
