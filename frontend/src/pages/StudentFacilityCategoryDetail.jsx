import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import StudentPortalShell from "../components/StudentPortalShell";
import { facilityCategoryGrid } from "../data/facilityCatalog";
import { fetchAllResources } from "../services/resources";

function StudentFacilityCategoryDetail() {
  const { categorySlug } = useParams();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  const category = facilityCategoryGrid.find((item) => item.slug === categorySlug);

  useEffect(() => {
    const loadResources = async () => {
      try {
        const allResources = await fetchAllResources();
        if (category) {
          const filtered = allResources.filter((item) => category.sourceCategories.includes(item.category));
          setFacilities(filtered);
        }
      } catch (err) {
        console.error("Failed to load resources:", err);
      } finally {
        setLoading(false);
      }
    };
    loadResources();
  }, [category]);

  if (!category) {
    return <Navigate to="/student/facilities" replace />;
  }

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
            {loading ? (
              <p className="helper-text">Loading resources...</p>
            ) : facilities.length === 0 ? (
              <p className="helper-text">No resources found in this category.</p>
            ) : (
              facilities.map((facility) => (
                <Link
                  key={facility.slug}
                  className="student-facility-catalog-card"
                  style={{ "--facility-accent": category.accent }}
                  to={`/student/resources/${facility.slug}`}
                >
                  <strong>{facility.name}</strong>
                </Link>
              ))
            )}
          </div>
        </article>
      </section>
    </StudentPortalShell>
  );
}

export default StudentFacilityCategoryDetail;
