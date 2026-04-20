import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import StudentPortalShell from "../components/StudentPortalShell";
import { fetchBuildingFloors, fetchStudentFacilitiesOverview } from "../services/facilities";
import { readApiError } from "../services/api";

function StudentFacilityFloors() {
  const { buildingId } = useParams();
  const [floors, setFloors] = useState([]);
  const [buildingName, setBuildingName] = useState("Building");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFloors = async () => {
      try {
        const [overview, floorData] = await Promise.all([
          fetchStudentFacilitiesOverview(),
          fetchBuildingFloors(buildingId),
        ]);
        const building = overview.buildings.find((item) => item.id === buildingId);
        setBuildingName(building?.name || "Building");
        setFloors(floorData);
      } catch (err) {
        setError(readApiError(err));
      } finally {
        setLoading(false);
      }
    };

    loadFloors();
  }, [buildingId]);

  return (
    <StudentPortalShell activeKey="facilities">
      <section className="student-modern-hero-card student-facilities-hero">
        <div className="student-modern-hero-copy">
          <p className="student-modern-section-label">Floors</p>
          <h2>{buildingName}</h2>
          <p>Select a floor to see all classrooms available for booking.</p>
        </div>
      </section>

      <div className="student-facility-breadcrumb">
        <Link to="/student/facilities">{"< Back to Buildings"}</Link>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <section className="student-facilities-grid">
        <article className="student-modern-workspace-card student-facilities-wide-card">
          <div className="student-modern-card-head">
            <div>
              <p className="student-modern-section-label">Floors</p>
              <h3>Choose a Floor</h3>
            </div>
          </div>

          {loading ? (
            <p className="helper-text">Loading floors...</p>
          ) : (
            <div className="student-floor-card-grid">
              {floors.map((floor) => (
                <Link
                  key={floor.floorNumber}
                  className="student-floor-card"
                  to={`/student/facilities/buildings/${buildingId}/floors/${floor.floorNumber}`}
                >
                  <strong>{floor.label}</strong>
                  <span>{floor.classroomCount} classrooms</span>
                </Link>
              ))}
            </div>
          )}
        </article>
      </section>
    </StudentPortalShell>
  );
}

export default StudentFacilityFloors;
