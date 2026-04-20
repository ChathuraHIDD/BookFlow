import { Link, Navigate, useParams } from "react-router-dom";

import StudentPortalShell from "../components/StudentPortalShell";
import { facilityCatalog, facilityCategoryGrid } from "../data/facilityCatalog";

function StudentFacilityCategoryDetail() {
  const { categorySlug } = useParams();
  const category = facilityCategoryGrid.find((item) => item.slug === categorySlug);

  if (!category) {
    return <Navigate to="/student/facilities" replace />;
  }

  const facilities = facilityCatalog.filter((item) => category.sourceCategories.includes(item.category));

  return (
    <StudentPortalShell activeKey="facilities">
      <section className="student-modern-hero-card student-facilities-hero">
        <div className="student-modern-hero-copy">
          <p className="student-modern-section-label">Facilities Category</p>
          <h2>{category.name}</h2>
          <p>Select a sub part to view locations and available resources.</p>
        </div>
      </section>

      <div className="student-facility-breadcrumb">
        <Link to="/student/facilities">{"< Back to Facilities Catalogue"}</Link>
      </div>

      <section className="student-facilities-grid">
        <article className="student-modern-workspace-card student-facilities-wide-card">
          <div className="student-modern-card-head student-facility-catalog-head">
            <div>
              <p className="student-modern-section-label">Sub Parts</p>
              <h3>{category.name}</h3>
            </div>
          </div>

          <div className="student-facility-catalog-grid">
            {facilities.map((facility) => (
              <Link
                key={facility.slug}
                className="student-facility-catalog-card"
                style={{ "--facility-accent": facility.accent }}
                to={`/student/facilities/catalog/${facility.slug}`}
              >
                <strong>{facility.name}</strong>
              </Link>
            ))}
          </div>
        </article>
      </section>
    </StudentPortalShell>
  );
}

export default StudentFacilityCategoryDetail;
