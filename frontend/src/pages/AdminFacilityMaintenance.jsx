import { useCallback, useEffect, useMemo, useState } from "react";

import PortalLayout from "../components/PortalLayout";
import {
  fetchAdminFacilitiesBuildings,
  fetchAdminFloorClassrooms,
  updateAdminClassroomStatus,
} from "../services/facilities";
import { readApiError } from "../services/api";
import "./AdminFacilities.css";

function normalizeFacilityStatus(status) {
  const normalized = (status || "AVAILABLE").toUpperCase();

  if (normalized === "UNAVAILABLE") {
    return "MAINTENANCE";
  }

  if (normalized === "PARTIALLY_BOOKED") {
    return "BOOKED";
  }

  if (["AVAILABLE", "BOOKED", "MAINTENANCE", "CLOSED"].includes(normalized)) {
    return normalized;
  }

  return "AVAILABLE";
}

function formatDisplayLabel(value) {
  if (!value) {
    return "Not set";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function AdminFacilityMaintenance() {
  const [buildings, setBuildings] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [facilityActionId, setFacilityActionId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [floorFilter, setFloorFilter] = useState("ALL");

  const loadFacilities = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const buildingData = await fetchAdminFacilitiesBuildings();
      const normalizedBuildings = Array.isArray(buildingData) ? buildingData : [];
      setBuildings(normalizedBuildings);

      const floorRequests = normalizedBuildings.flatMap((building) => {
        const floorCount = Math.max(Number(building.floorCount) || 1, 1);

        return Array.from({ length: floorCount }, (_, index) => {
          const floorNumber = index + 1;

          return fetchAdminFloorClassrooms(building.id, floorNumber)
            .then((roomData) =>
              (Array.isArray(roomData) ? roomData : []).map((room) => ({
                id: room.id,
                name: room.roomNumber,
                category: room.type || "Facility",
                buildingId: building.id,
                buildingName: building.name || "Unnamed Building",
                buildingCode: building.code || "",
                floorNumber,
                capacity: room.capacity || 0,
                equipment: Array.isArray(room.equipment) ? room.equipment : [],
                displayStatus: normalizeFacilityStatus(room.operationalStatus || room.status),
              }))
            )
            .catch((err) => {
              setError(readApiError(err));
              return [];
            });
        });
      });

      const facilityData = await Promise.all(floorRequests);
      setFacilities(facilityData.flat());
    } catch (err) {
      setError(readApiError(err));
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  const buildingOptions = useMemo(
    () => buildings.map((building) => ({ value: building.id, label: building.name || building.code || "Unnamed Building" })),
    [buildings]
  );

  const typeOptions = useMemo(() => {
    const values = new Set();
    facilities.forEach((facility) => values.add(facility.category || "Facility"));
    return Array.from(values).sort((left, right) => left.localeCompare(right));
  }, [facilities]);

  const floorOptions = useMemo(() => {
    const values = new Set();
    facilities.forEach((facility) => values.add(facility.floorNumber));
    return Array.from(values).sort((left, right) => left - right);
  }, [facilities]);

  const filteredFacilities = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return facilities.filter((facility) => {
      const searchableText = [
        facility.name,
        facility.category,
        facility.buildingName,
        facility.buildingCode,
        String(facility.floorNumber),
        String(facility.capacity),
        facility.displayStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (normalizedSearch && !searchableText.includes(normalizedSearch)) {
        return false;
      }

      if (buildingFilter !== "ALL" && facility.buildingId !== buildingFilter) {
        return false;
      }

      if (typeFilter !== "ALL" && (facility.category || "").toLowerCase() !== typeFilter.toLowerCase()) {
        return false;
      }

      if (statusFilter !== "ALL" && facility.displayStatus !== statusFilter) {
        return false;
      }

      if (floorFilter !== "ALL" && String(facility.floorNumber) !== floorFilter) {
        return false;
      }

      return true;
    });
  }, [buildingFilter, facilities, floorFilter, searchTerm, statusFilter, typeFilter]);

  const activeFiltersCount = [searchTerm, buildingFilter, typeFilter, statusFilter, floorFilter].filter((value) => value && value !== "ALL").length;

  const resetFilters = () => {
    setSearchTerm("");
    setBuildingFilter("ALL");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
    setFloorFilter("ALL");
  };

  const handleFacilityStatus = async (facilityId, nextStatus) => {
    try {
      setError("");
      setFacilityActionId(facilityId);
      await updateAdminClassroomStatus(facilityId, nextStatus === "AVAILABLE" ? "AVAILABLE" : "UNAVAILABLE");
      setFacilities((current) =>
        current.map((facility) =>
          facility.id === facilityId
            ? { ...facility, displayStatus: nextStatus === "AVAILABLE" ? "AVAILABLE" : "MAINTENANCE" }
            : facility
        )
      );
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setFacilityActionId("");
    }
  };

  return (
    <PortalLayout
      title="Facility Maintenance"
      subtitle="View all facilities and update their operational status from one maintenance-focused table."
      pageClassName="admin-facilities-page"
    >
      <div className="admin-facilities-stack">
        <section className="admin-facility-panel">
          <div className="admin-facility-panel-head">
            <div>
              <p className="student-modern-section-label">Facility Table</p>
              <h3>All campus facilities</h3>
              <p>
                {filteredFacilities.length} facilities shown{activeFiltersCount ? ` with ${activeFiltersCount} active filter${activeFiltersCount === 1 ? "" : "s"}` : ""}.
              </p>
            </div>

            <div className="admin-facility-banner-actions">
              <button type="button" className="ghost-btn" onClick={loadFacilities}>
                Refresh Data
              </button>
              <button type="button" className="ghost-btn" onClick={resetFilters} disabled={!activeFiltersCount}>
                Clear Filters
              </button>
            </div>
          </div>

          <div className="admin-facility-filter-bar">
            <label className="admin-facility-filter-field">
              Search
              <input
                value={searchTerm}
                placeholder="Room, building, category, or capacity"
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <label className="admin-facility-filter-field">
              Building
              <select value={buildingFilter} onChange={(event) => setBuildingFilter(event.target.value)}>
                <option value="ALL">All Buildings</option>
                {buildingOptions.map((building) => (
                  <option key={building.value} value={building.value}>
                    {building.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-facility-filter-field">
              Type
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="ALL">All Types</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-facility-filter-field">
              Status
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="BOOKED">Booked</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="CLOSED">Closed</option>
              </select>
            </label>
            <label className="admin-facility-filter-field">
              Floor
              <select value={floorFilter} onChange={(event) => setFloorFilter(event.target.value)}>
                <option value="ALL">All Floors</option>
                {floorOptions.map((floorNumber) => (
                  <option key={floorNumber} value={String(floorNumber)}>
                    Floor {floorNumber}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          {loading ? (
            <p className="helper-text">Loading facility data...</p>
          ) : filteredFacilities.length ? (
            <div className="admin-facility-table-wrap">
              <table className="admin-facility-table">
                <thead>
                  <tr>
                    <th>Facility Name</th>
                    <th>Category</th>
                    <th>Building</th>
                    <th>Floor</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacilities.map((facility) => {
                    const isBusy = facilityActionId === facility.id;
                    const displayStatus = facility.displayStatus;

                    return (
                      <tr key={facility.id}>
                        <td>
                          <div className="admin-facility-table-main">
                            <strong>{facility.name}</strong>
                            <span>{facility.buildingCode ? `${facility.buildingCode} · ` : ""}{facility.equipment.length ? facility.equipment.join(", ") : "No equipment listed"}</span>
                          </div>
                        </td>
                        <td>
                          <span className="admin-facility-table-meta">{facility.category}</span>
                        </td>
                        <td>
                          <div className="admin-facility-table-main">
                            <strong>{facility.buildingName}</strong>
                            <span>{facility.buildingCode || "Campus building"}</span>
                          </div>
                        </td>
                        <td>
                          <span className="admin-facility-table-meta">Floor {facility.floorNumber}</span>
                        </td>
                        <td>
                          <span className="admin-facility-table-meta">{facility.capacity} seats</span>
                        </td>
                        <td>
                          <span className={`admin-facility-status-badge admin-facility-status-${displayStatus.toLowerCase()}`}>
                            {formatDisplayLabel(displayStatus)}
                          </span>
                        </td>
                        <td>
                          <div className="admin-facility-table-actions">
                            <button
                              type="button"
                              className="admin-facility-mini-btn admin-facility-mini-btn-available"
                              disabled={isBusy && displayStatus === "AVAILABLE"}
                              onClick={() => handleFacilityStatus(facility.id, "AVAILABLE")}
                            >
                              Active
                            </button>
                            <button
                              type="button"
                              className="admin-facility-mini-btn admin-facility-mini-btn-maintenance"
                              disabled={isBusy && displayStatus === "MAINTENANCE"}
                              onClick={() => handleFacilityStatus(facility.id, "MAINTENANCE")}
                            >
                              Maintenance
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-facility-empty-state">
              <p>No facilities match the current search and filter criteria.</p>
            </div>
          )}
        </section>
      </div>
    </PortalLayout>
  );
}

export default AdminFacilityMaintenance;
