import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import StudentPortalShell from "../components/StudentPortalShell";
import { facilityCatalog } from "../data/facilityCatalog";

function StudentFacilityCatalogDetail() {
  const { facilitySlug } = useParams();
  const facility = facilityCatalog.find((item) => item.slug === facilitySlug);
  const [requestForm, setRequestForm] = useState({
    fullName: "",
    studentId: "",
    preferredDate: "",
    preferredTime: "",
    purpose: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);

  if (!facility) {
    return <Navigate to="/student/facilities" replace />;
  }

  const relatedFacilities = facilityCatalog.filter(
    (item) => item.category === facility.category && item.slug !== facility.slug,
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setRequestForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <StudentPortalShell activeKey="facilities">
      <section className="student-modern-hero-card student-facilities-hero">
        <div className="student-modern-hero-copy">
          <p className="student-modern-section-label">{facility.category}</p>
          <h2>{facility.name}</h2>
          <p>{facility.description}</p>
        </div>
      </section>

      <div className="student-facility-breadcrumb">
        <Link to="/student/facilities">{"< Back to Facilities Catalogue"}</Link>
      </div>

      <section className="student-facilities-grid">
        <article className="student-modern-workspace-card student-facilities-wide-card">
          <div className="student-modern-card-head">
            <div>
              <p className="student-modern-section-label">Sub Parts</p>
              <h3>{facility.name}</h3>
            </div>
          </div>

          <div className="student-facility-catalog-detail student-facility-catalog-detail-single">
            <div className="student-facility-catalog-detail-panel">
              <div>
                <span className="student-facility-catalog-detail-label">Common locations</span>
                <ul className="student-facility-chip-grid">
                  {facility.locations.map((location) => (
                    <li key={location} className="student-facility-chip">
                      {location}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="student-facility-catalog-detail-label">Available resources</span>
                <ul className="student-facility-chip-grid">
                  {facility.resources.map((resource) => (
                    <li key={resource} className="student-facility-chip student-facility-chip-accent">
                      {resource}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="student-facility-catalog-divider" />

          <div className="student-modern-card-head student-facility-catalog-head">
            <div>
              <p className="student-modern-section-label">Request Form</p>
              <h3>Fill Details for {facility.name}</h3>
            </div>
          </div>

          <form className="form-grid student-facility-request-form" onSubmit={handleSubmit}>
            <label>
              Full Name
              <input
                type="text"
                name="fullName"
                value={requestForm.fullName}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Student ID
              <input
                type="text"
                name="studentId"
                value={requestForm.studentId}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Preferred Date
              <input
                type="date"
                name="preferredDate"
                value={requestForm.preferredDate}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Preferred Time
              <input
                type="time"
                name="preferredTime"
                value={requestForm.preferredTime}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Purpose
              <input
                type="text"
                name="purpose"
                value={requestForm.purpose}
                onChange={handleChange}
                placeholder="Ex: Group assignment meeting"
                required
              />
            </label>

            <label>
              Additional Notes
              <textarea
                rows="4"
                name="notes"
                value={requestForm.notes}
                onChange={handleChange}
                placeholder="Add any special requirements"
              />
            </label>

            <div className="student-facility-request-actions">
              <button type="submit" className="solid-btn">
                Submit Request
              </button>
            </div>
          </form>

          {submitted ? (
            <p className="student-facility-request-success">
              Request received for {facility.name}. The facilities team will review and confirm availability.
            </p>
          ) : null}

          {relatedFacilities.length ? (
            <>
              <div className="student-facility-catalog-divider" />
              <div className="student-modern-card-head student-facility-catalog-head">
                <div>
                  <p className="student-modern-section-label">More in {facility.category}</p>
                  <h3>Related Facilities</h3>
                </div>
              </div>
              <div className="student-facility-catalog-grid">
                {relatedFacilities.map((item) => (
                  <Link
                    key={item.slug}
                    className="student-facility-catalog-card"
                    style={{ "--facility-accent": item.accent }}
                    to={`/student/facilities/catalog/${item.slug}`}
                  >
                    <strong>{item.name}</strong>
                  </Link>
                ))}
              </div>
            </>
          ) : null}
        </article>
      </section>
    </StudentPortalShell>
  );
}

export default StudentFacilityCatalogDetail;
