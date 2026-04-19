import { Link, Navigate, useParams } from "react-router-dom";

import StudentPortalShell from "../components/StudentPortalShell";
import { facilityCatalog } from "../data/facilityCatalog";

function StudentFacilityCatalogDetail() {
  const { facilitySlug } = useParams();
  const facility = facilityCatalog.find((item) => item.slug === facilitySlug);

  if (!facility) {
    return <Navigate to="/student/facilities" replace />;
  }

  const relatedFacilities = facilityCatalog.filter(
    (item) => item.category === facility.category && item.slug !== facility.slug,
  );

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
