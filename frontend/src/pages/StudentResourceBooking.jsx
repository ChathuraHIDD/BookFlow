import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import StudentPortalShell from "../components/StudentPortalShell";
import { fetchResourceBySlug } from "../services/resources";

function StudentResourceBooking() {
  const { slug } = useParams();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
            {/* The booking form will be added in Step 12 */}
            <p style={{ marginTop: "1rem" }}>
              Booking form integration pending (Step 12).
            </p>
          </div>
        </aside>
      </div>
    </StudentPortalShell>
  );
}

export default StudentResourceBooking;
