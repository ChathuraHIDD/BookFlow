import { useEffect, useMemo, useState } from "react";
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

  const totalClassrooms = useMemo(
    () => floors.reduce((sum, floor) => sum + (floor.classroomCount || 0), 0),
    [floors]
  );

  const busiestFloorNumber = useMemo(() => {
    if (!floors.length) {
      return null;
    }

    return floors.reduce((bestFloor, currentFloor) => {
      if ((currentFloor.classroomCount || 0) > (bestFloor.classroomCount || 0)) {
        return currentFloor;
      }
      return bestFloor;
    }, floors[0]).floorNumber;
  }, [floors]);

  return (
    <StudentPortalShell activeKey="facilities">
      <section className="student-modern-hero-card student-facilities-hero student-floor-page-hero">
        <div className="student-modern-hero-copy">
          <p className="student-modern-section-label">Floors</p>
          <h2>{buildingName}</h2>
          <p>Select a floor to open the available classrooms for booking. The layout below highlights where to start and how many rooms are available on each level.</p>
        </div>

        <div className="student-floor-page-hero-stats" aria-label="Building floor summary">
          <article className="student-floor-page-stat">
            <span>Total floors</span>
            <strong>{floors.length}</strong>
          </article>
          <article className="student-floor-page-stat">
            <span>Total classrooms</span>
            <strong>{totalClassrooms}</strong>
          </article>
          <article className="student-floor-page-stat">
            <span>Recommended start</span>
            <strong>{busiestFloorNumber === null ? "Not available" : `Floor ${busiestFloorNumber}`}</strong>
          </article>
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
              <p className="helper-text student-floor-page-intro">
                Pick the floor that matches your classroom needs. Floors with more rooms are easier starting points when you want faster booking.
              </p>
            </div>
          </div>

          {loading ? (
            <p className="helper-text">Loading floors...</p>
          ) : floors.length === 0 ? (
            <div className="student-floor-page-empty">
              <strong>No floors are available for this building yet.</strong>
              <p>Try another building or ask an administrator to add floor and classroom details.</p>
              <Link className="solid-btn" to="/student/facilities">Browse Buildings</Link>
            </div>
          ) : (
            <div className="student-floor-card-grid">
              {floors.map((floor, index) => (
                <Link
                  key={floor.floorNumber}
                  className="student-floor-card student-floor-card-pro"
                  to={`/student/facilities/buildings/${buildingId}/floors/${floor.floorNumber}`}
                >
                  <div className="student-floor-card-topline">
                    <span className="student-floor-card-badge">Floor {floor.floorNumber}</span>
                    {floor.floorNumber === busiestFloorNumber ? (
                      <span className="student-floor-card-chip">Recommended</span>
                    ) : null}
                  </div>

                  <div className="student-floor-card-headline">
                    <strong>{floor.label}</strong>
                    <p>
                      {floor.classroomCount > 0
                        ? "Open this floor to view classroom availability and continue to booking."
                        : "This floor is listed, but no classrooms are available yet."}
                    </p>
                  </div>

                  <div className="student-floor-card-metrics">
                    <div>
                      <span>Classrooms</span>
                      <strong>{floor.classroomCount}</strong>
                    </div>
                    <div>
                      <span>Priority</span>
                      <strong>{index === 0 ? "Quick access" : "Standard"}</strong>
                    </div>
                  </div>

                  <div className="student-floor-card-footer">
                    <span>{floor.classroomCount > 0 ? "View classrooms" : "Details only"}</span>
                    <span aria-hidden="true">→</span>
                  </div>
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
