import { useEffect, useMemo, useState } from "react";

import PortalLayout from "../components/PortalLayout";
import {
  createAdminBuilding,
  createAdminClassroom,
  deleteAdminClassroom,
  fetchAdminFacilitiesBuildings,
  fetchAdminFacilityBookings,
  fetchAdminFacilityReports,
  fetchAdminFloorClassrooms,
  updateAdminBuildingFloors,
  updateAdminBookingStatus,
  updateAdminClassroom,
  updateAdminClassroomStatus,
} from "../services/facilities";
import { readApiError } from "../services/api";
import "./AdminFacilities.css";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "available", label: "Available" },
  { value: "booked", label: "Booked" },
  { value: "maintenance", label: "Maintenance" },
  { value: "closed", label: "Closed" },
];

function AdminFacilities() {
  const [reports, setReports] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [facilityInventory, setFacilityInventory] = useState([]);
  const [facilityOverrides, setFacilityOverrides] = useState({});
  const [bookings, setBookings] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classroomLoading, setClassroomLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("1");
  const [editingClassroomId, setEditingClassroomId] = useState("");
  const [showFacilityForm, setShowFacilityForm] = useState(false);
  const [savingBookingId, setSavingBookingId] = useState("");
  const [savingBookingStatus, setSavingBookingStatus] = useState("");
  const [facilityFilters, setFacilityFilters] = useState({
    search: "",
    buildingId: "ALL",
    type: "ALL",
    status: "ALL",
    floor: "ALL",
  });

  const [buildingForm, setBuildingForm] = useState({
    name: "",
    code: "",
    floorCount: 1,
  });

  const [floorForm, setFloorForm] = useState({
    buildingId: "",
    floorCount: 1,
  });

  const [classroomForm, setClassroomForm] = useState({
    buildingId: "",
    floorNumber: 1,
    roomNumber: "",
    capacity: 30,
    type: "Lecture Hall",
    equipment: "Projector, AC",
  });

  const [editForm, setEditForm] = useState({
    roomNumber: "",
    capacity: 30,
    type: "",
    equipment: "",
  });

  const normalizeStatus = (status) => (status || "").toString().trim().toUpperCase();

  const resolveFacilityStatus = (facility) => {
    const override = facilityOverrides[facility.id];
    if (override) {
      return override;
    }

    const normalized = normalizeStatus(facility.status);
    if (normalized === "AVAILABLE") return "available";
    if (normalized === "BOOKED" || normalized === "PARTIALLY_BOOKED") return "booked";
    if (normalized === "UNAVAILABLE") return "maintenance";
    if (normalized === "CLOSED") return "closed";
    return "available";
  };

  const formatFloorLabel = (value) => {
    if (value === "ALL") return "All floors";
    return `Floor ${value}`;
  };

  const loadFacilityInventory = async (buildingData) => {
    if (!buildingData.length) {
      return [];
    }

    const floorRequests = buildingData.flatMap((building) => {
      const floorTotal = Math.max(Number(building.floorCount) || 1, 1);
      return Array.from({ length: floorTotal }, (_, index) => {
        const floorNumber = index + 1;
        return fetchAdminFloorClassrooms(building.id, floorNumber).then((floorClassrooms) => (
          floorClassrooms.map((classroom) => ({
            ...classroom,
            buildingId: building.id,
            buildingName: building.name,
            buildingCode: building.code,
            floorCount: floorTotal,
            floorNumber,
          }))
        ));
      });
    });

    const batches = await Promise.all(floorRequests);
    return batches.flat();
  };

  const loadAdminData = async () => {
    try {
      setError("");
      setLoading(true);
      const [reportData, buildingData, bookingData] = await Promise.all([
        fetchAdminFacilityReports(),
        fetchAdminFacilitiesBuildings(),
        fetchAdminFacilityBookings(),
      ]);

      setReports(reportData);
      setBuildings(buildingData);
      setBookings(bookingData || []);

      const firstBuildingId = selectedBuildingId || buildingData[0]?.id || "";
      const firstBuilding = buildingData.find((item) => item.id === firstBuildingId) || buildingData[0] || null;
      const firstFloorCount = Math.max(Number(firstBuilding?.floorCount) || 1, 1);
      const safeFloor = Math.min(Number(selectedFloor) || 1, firstFloorCount);

      setSelectedBuildingId(firstBuildingId);
      setSelectedFloor(String(safeFloor));

      setFloorForm((current) => ({
        ...current,
        buildingId: current.buildingId || firstBuildingId,
      }));

      setClassroomForm((current) => ({
        ...current,
        buildingId: current.buildingId || firstBuildingId,
        floorNumber: current.floorNumber || safeFloor,
      }));

      const inventoryData = await loadFacilityInventory(buildingData);
      setFacilityInventory(inventoryData);
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadClassrooms = async (buildingId, floorNumber) => {
    if (!buildingId) {
      setClassrooms([]);
      setEditingClassroomId("");
      return;
    }

    try {
      setClassroomLoading(true);
      const data = await fetchAdminFloorClassrooms(buildingId, floorNumber);
      setClassrooms(data);
      setEditingClassroomId((current) => (data.some((room) => room.id === current) ? current : ""));
      if (!data.length) {
        setEditForm({
          roomNumber: "",
          capacity: 30,
          type: "",
          equipment: "",
        });
      }
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setClassroomLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    loadClassrooms(selectedBuildingId, selectedFloor);
  }, [selectedBuildingId, selectedFloor]);

  useEffect(() => {
    const classroom = classrooms.find((item) => item.id === editingClassroomId);
    if (!classroom) {
      return;
    }

    setEditForm({
      roomNumber: classroom.roomNumber,
      capacity: classroom.capacity,
      type: classroom.type,
      equipment: (classroom.equipment || []).join(", "),
    });
  }, [editingClassroomId, classrooms]);

  const handleCreateBuilding = async () => {
    try {
      await createAdminBuilding({
        ...buildingForm,
        floorCount: Number(buildingForm.floorCount),
      });
      setBuildingForm({ name: "", code: "", floorCount: 1 });
      await loadAdminData();
    } catch (err) {
      setError(readApiError(err));
    }
  };

  const handleUpdateFloors = async () => {
    try {
      await updateAdminBuildingFloors(floorForm.buildingId, {
        floorCount: Number(floorForm.floorCount),
      });
      await loadAdminData();
    } catch (err) {
      setError(readApiError(err));
    }
  };

  const handleCreateClassroom = async () => {
    try {
      await createAdminClassroom(classroomForm.buildingId, Number(classroomForm.floorNumber), {
        roomNumber: classroomForm.roomNumber,
        capacity: Number(classroomForm.capacity),
        type: classroomForm.type,
        equipment: classroomForm.equipment.split(",").map((item) => item.trim()).filter(Boolean),
      });
      setClassroomForm((current) => ({
        ...current,
        roomNumber: "",
        capacity: 30,
        equipment: "Projector, AC",
      }));
      setShowFacilityForm(false);
      await loadAdminData();
    } catch (err) {
      setError(readApiError(err));
    }
  };

  const handleSaveClassroom = async () => {
    if (!editingClassroomId) {
      return;
    }

    try {
      await updateAdminClassroom(editingClassroomId, {
        roomNumber: editForm.roomNumber,
        capacity: Number(editForm.capacity),
        type: editForm.type,
        equipment: editForm.equipment.split(",").map((item) => item.trim()).filter(Boolean),
      });
      await loadAdminData();
    } catch (err) {
      setError(readApiError(err));
    }
  };

  const handleDeleteClassroom = async (classroomId) => {
    try {
      await deleteAdminClassroom(classroomId);
      if (editingClassroomId === classroomId) {
        setEditingClassroomId("");
      }
      await loadAdminData();
    } catch (err) {
      setError(readApiError(err));
    }
  };

  const handleFacilityStatus = async (facility, nextStatus) => {
    try {
      const backendStatus = nextStatus === "available" ? "AVAILABLE" : "UNAVAILABLE";
      await updateAdminClassroomStatus(facility.id, backendStatus);
      setFacilityOverrides((current) => {
        const nextOverrides = { ...current };
        if (nextStatus === "available") {
          delete nextOverrides[facility.id];
          return nextOverrides;
        }
        nextOverrides[facility.id] = nextStatus;
        return nextOverrides;
      });
      await loadAdminData();
    } catch (err) {
      setError(readApiError(err));
    }
  };

  const handleBookingDecision = async (bookingId, status) => {
    try {
      setSavingBookingId(bookingId);
      setSavingBookingStatus(status);
      await updateAdminBookingStatus(
        bookingId,
        status,
        status === "REJECTED" ? "Rejected from facility control panel" : "Approved from facility control panel"
      );
      await loadAdminData();
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setSavingBookingId("");
      setSavingBookingStatus("");
    }
  };

  const handleEditFacility = (facility) => {
    setSelectedBuildingId(facility.buildingId);
    setSelectedFloor(String(facility.floorNumber));
    setEditingClassroomId(facility.id);
    setShowFacilityForm(true);
  };

  const selectedClassroom = classrooms.find((item) => item.id === editingClassroomId);

  const facilityRows = useMemo(() => {
    return facilityInventory.map((facility) => ({
      ...facility,
      resolvedStatus: resolveFacilityStatus(facility),
    }));
  }, [facilityInventory, facilityOverrides]);

  const filteredFacilities = useMemo(() => {
    const query = facilityFilters.search.trim().toLowerCase();

    return facilityRows.filter((facility) => {
      const matchesSearch =
        !query ||
        [facility.roomNumber, facility.type, facility.buildingName, facility.buildingCode, facility.status]
          .filter(Boolean)
          .some((value) => value.toString().toLowerCase().includes(query));

      const matchesBuilding = facilityFilters.buildingId === "ALL" || facility.buildingId === facilityFilters.buildingId;
      const matchesType = facilityFilters.type === "ALL" || facility.type === facilityFilters.type;
      const matchesStatus = facilityFilters.status === "ALL" || facility.resolvedStatus === facilityFilters.status;
      const matchesFloor = facilityFilters.floor === "ALL" || String(facility.floorNumber) === facilityFilters.floor;

      return matchesSearch && matchesBuilding && matchesType && matchesStatus && matchesFloor;
    });
  }, [facilityRows, facilityFilters]);

  const facilityTypes = useMemo(() => {
    const values = new Set(facilityRows.map((facility) => facility.type).filter(Boolean));
    return Array.from(values).sort((left, right) => left.localeCompare(right));
  }, [facilityRows]);

  const floorOptions = useMemo(() => {
    const maxFloor = Math.max(...buildings.map((building) => Number(building.floorCount) || 1), 1);
    return Array.from({ length: maxFloor }, (_, index) => String(index + 1));
  }, [buildings]);

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => normalizeStatus(booking.status) === "PENDING"),
    [bookings]
  );

  const analytics = useMemo(() => {
    const availableToday = facilityRows.filter((facility) => facility.resolvedStatus === "available").length;
    const bookedToday = facilityRows.filter((facility) => facility.resolvedStatus === "booked").length;
    const maintenanceCount = facilityRows.filter((facility) => facility.resolvedStatus === "maintenance").length;

    return {
      totalFacilities: facilityRows.length,
      availableToday,
      bookedToday,
      pendingRequests: pendingBookings.length,
      maintenanceCount,
    };
  }, [facilityRows, pendingBookings.length]);

  const maintenanceFacilities = useMemo(
    () => facilityRows.filter((facility) => facility.resolvedStatus === "maintenance" || facility.resolvedStatus === "closed"),
    [facilityRows]
  );

  const selectedBuildingName = buildings.find((building) => building.id === selectedBuildingId)?.name || "Select a building";

  return (
    <PortalLayout
      title="Admin Facilities"
      subtitle="Control classroom availability, facility status, booking approvals, and maintenance operations from one pastel dashboard."
      pageClassName="admin-facilities-page"
    >
      {error ? <p className="error-text">{error}</p> : null}

      {reports ? (
        <section className="stats-grid admin-facility-stats-grid">
          <article className="admin-facility-stat-card admin-facility-stat-card-total">
            <h3>Total Facilities</h3>
            <p className="metric-number">{analytics.totalFacilities || reports.totalClassrooms || 0}</p>
          </article>
          <article className="admin-facility-stat-card admin-facility-stat-card-available">
            <h3>Available Today</h3>
            <p className="metric-number">{analytics.availableToday}</p>
          </article>
          <article className="admin-facility-stat-card admin-facility-stat-card-booked">
            <h3>Booked Today</h3>
            <p className="metric-number">{analytics.bookedToday}</p>
          </article>
          <article className="admin-facility-stat-card admin-facility-stat-card-pending">
            <h3>Pending Requests</h3>
            <p className="metric-number">{analytics.pendingRequests || reports.pendingBookings || 0}</p>
          </article>
          <article className="admin-facility-stat-card admin-facility-stat-card-maintenance">
            <h3>Maintenance Facilities</h3>
            <p className="metric-number">{analytics.maintenanceCount || reports.unavailableClassrooms || 0}</p>
          </article>
        </section>
      ) : null}

      <section className="admin-facilities-stack">
        <article className="admin-facility-banner">
          <div className="admin-facility-banner-top">
            <div className="admin-facility-banner-copy">
              <span className="admin-facility-kicker">Facility Management</span>
              <h2>Professional control panel for classrooms, booking requests, and maintenance operations.</h2>
              <p>
                Use the search and filters to review every facility across the campus, approve pending booking
                requests, and move rooms between available, booked, maintenance, and closed states.
              </p>
            </div>
            <div className="admin-facility-banner-actions">
              <button type="button" className="solid-btn" onClick={() => setShowFacilityForm((current) => !current)}>
                {showFacilityForm ? "Hide New Facility Form" : "Add New Facility"}
              </button>
              <button type="button" className="ghost-btn" onClick={loadAdminData}>
                Refresh Dashboard
              </button>
            </div>
          </div>
          <div className="admin-facility-chip-row">
            <span className="admin-facility-chip">
              <strong>{buildings.length}</strong> Buildings
            </span>
            <span className="admin-facility-chip">
              <strong>{facilityRows.length}</strong> Facilities
            </span>
            <span className="admin-facility-chip">
              <strong>{pendingBookings.length}</strong> Requests awaiting review
            </span>
            <span className="admin-facility-chip">
              <strong>{selectedBuildingName}</strong> Current selection
            </span>
          </div>
        </article>

        <div className="admin-facility-grid">
          <article className="admin-facility-panel admin-facility-panel-wide">
            <div className="admin-facility-panel-head">
              <div>
                <span className="student-modern-section-label">Control Panel</span>
                <h3>Facility Management Table</h3>
                <p>
                  Review facilities across all buildings, filter by status or floor, and jump directly into edit or
                  maintenance actions.
                </p>
              </div>
              <div className="admin-facility-inline-actions">
                <span className="admin-facility-note">Table updates automatically reflect the latest admin changes.</span>
              </div>
            </div>

            <div className="admin-facility-filter-bar">
              <label className="admin-facility-filter-field">
                Search
                <input
                  value={facilityFilters.search}
                  onChange={(event) => setFacilityFilters((current) => ({ ...current, search: event.target.value }))}
                  placeholder="Search facility, building, category, or status"
                />
              </label>
              <label className="admin-facility-filter-field">
                Building
                <select
                  value={facilityFilters.buildingId}
                  onChange={(event) => setFacilityFilters((current) => ({ ...current, buildingId: event.target.value }))}
                >
                  <option value="ALL">All buildings</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-facility-filter-field">
                Type
                <select
                  value={facilityFilters.type}
                  onChange={(event) => setFacilityFilters((current) => ({ ...current, type: event.target.value }))}
                >
                  <option value="ALL">All types</option>
                  {facilityTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-facility-filter-field">
                Status
                <select
                  value={facilityFilters.status}
                  onChange={(event) => setFacilityFilters((current) => ({ ...current, status: event.target.value }))}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-facility-filter-field">
                Floor
                <select
                  value={facilityFilters.floor}
                  onChange={(event) => setFacilityFilters((current) => ({ ...current, floor: event.target.value }))}
                >
                  <option value="ALL">All floors</option>
                  {floorOptions.map((floor) => (
                    <option key={floor} value={floor}>
                      Floor {floor}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="admin-facility-filter-summary">
              Showing {filteredFacilities.length} of {facilityRows.length} facilities across {buildings.length} buildings.
            </div>

            {showFacilityForm ? (
              <div className="admin-facility-panel admin-facility-panel-wide">
                <div className="admin-facility-panel-head">
                  <div>
                    <span className="student-modern-section-label">Quick Create</span>
                    <h4>Create New Facility</h4>
                    <p>Add a classroom or teaching space under an existing building and floor.</p>
                  </div>
                </div>
                <div className="admin-facility-form-grid">
                  <label>
                    Building
                    <select value={classroomForm.buildingId} onChange={(event) => setClassroomForm((current) => ({ ...current, buildingId: event.target.value }))}>
                      <option value="">Select building</option>
                      {buildings.map((building) => (
                        <option key={building.id} value={building.id}>
                          {building.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Floor
                    <input
                      type="number"
                      min="1"
                      value={classroomForm.floorNumber}
                      onChange={(event) => setClassroomForm((current) => ({ ...current, floorNumber: event.target.value }))}
                    />
                  </label>
                  <label>
                    Facility Name
                    <input
                      value={classroomForm.roomNumber}
                      onChange={(event) => setClassroomForm((current) => ({ ...current, roomNumber: event.target.value }))}
                      placeholder="Room A-301"
                    />
                  </label>
                  <label>
                    Category
                    <input
                      value={classroomForm.type}
                      onChange={(event) => setClassroomForm((current) => ({ ...current, type: event.target.value }))}
                      placeholder="Lecture Hall"
                    />
                  </label>
                  <label>
                    Capacity
                    <input
                      type="number"
                      min="1"
                      value={classroomForm.capacity}
                      onChange={(event) => setClassroomForm((current) => ({ ...current, capacity: event.target.value }))}
                    />
                  </label>
                  <label className="admin-facility-form-span-2">
                    Equipment
                    <input
                      value={classroomForm.equipment}
                      onChange={(event) => setClassroomForm((current) => ({ ...current, equipment: event.target.value }))}
                      placeholder="Projector, AC, Whiteboard"
                    />
                  </label>
                </div>
                <div className="admin-facility-inline-actions">
                  <button className="solid-btn" type="button" onClick={handleCreateClassroom}>
                    Create Facility
                  </button>
                  <button className="ghost-btn" type="button" onClick={() => setShowFacilityForm(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {loading ? (
              <p className="helper-text">Loading facilities...</p>
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
                      const statusTone = facility.resolvedStatus;
                      return (
                        <tr key={facility.id}>
                          <td>
                            <div className="admin-facility-table-main">
                              <strong>{facility.roomNumber}</strong>
                              <span>{facility.id}</span>
                            </div>
                          </td>
                          <td>{facility.type || "-"}</td>
                          <td>
                            <div className="admin-facility-table-main">
                              <strong>{facility.buildingName}</strong>
                              <span>{facility.buildingCode || "-"}</span>
                            </div>
                          </td>
                          <td>Floor {facility.floorNumber}</td>
                          <td>{facility.capacity}</td>
                          <td>
                            <span className={`admin-facility-status-badge admin-facility-status-${statusTone}`}>
                              {statusTone === "available"
                                ? "Available"
                                : statusTone === "booked"
                                  ? "Booked"
                                  : statusTone === "maintenance"
                                    ? "Maintenance"
                                    : "Closed"}
                            </span>
                          </td>
                          <td>
                            <div className="admin-facility-table-actions">
                              <button type="button" className="ghost-btn admin-facility-mini-btn admin-facility-mini-btn-edit" onClick={() => handleEditFacility(facility)}>
                                Edit
                              </button>
                              <button
                                type="button"
                                className="ghost-btn admin-facility-mini-btn admin-facility-mini-btn-available"
                                onClick={() => handleFacilityStatus(facility, "available")}
                              >
                                Available
                              </button>
                              <button
                                type="button"
                                className="ghost-btn admin-facility-mini-btn admin-facility-mini-btn-maintenance"
                                onClick={() => handleFacilityStatus(facility, "maintenance")}
                              >
                                Maintenance
                              </button>
                              <button
                                type="button"
                                className="ghost-btn admin-facility-mini-btn admin-facility-mini-btn-closed"
                                onClick={() => handleFacilityStatus(facility, "closed")}
                              >
                                Closed
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
                No facilities match the current filters.
              </div>
            )}
          </article>

          <article className="admin-facility-panel">
            <div className="admin-facility-panel-head">
              <div>
                <span className="student-modern-section-label">Booking Queue</span>
                <h3>Pending Requests</h3>
                <p>Review incoming facility booking requests and process them with one click.</p>
              </div>
            </div>

            <div className="admin-facility-pending-list">
              {pendingBookings.length ? (
                pendingBookings.map((booking) => {
                  const isBusy = savingBookingId === booking.id && (savingBookingStatus === "APPROVED" || savingBookingStatus === "REJECTED");
                  return (
                    <article key={booking.id} className="admin-facility-request-card">
                      <div className="admin-facility-request-head">
                        <div>
                          <strong>{booking.requestedByName || "Requester"}</strong>
                          <div className="admin-facility-request-meta">
                            {booking.buildingName || "Building"} · Floor {booking.floorNumber || "-"} · {booking.roomNumber || "Room"}
                          </div>
                        </div>
                        <span className="admin-facility-status-badge admin-facility-status-booked">Pending</span>
                      </div>
                      <div className="admin-facility-request-meta">
                        {booking.bookingDate || "Date not set"} · {booking.startTime || "--:--"} to {booking.endTime || "--:--"}
                        {booking.purpose ? ` · ${booking.purpose}` : ""}
                      </div>
                      <div className="admin-facility-request-actions">
                        <button
                          type="button"
                          className="solid-btn"
                          disabled={isBusy}
                          onClick={() => handleBookingDecision(booking.id, "APPROVED")}
                        >
                          {isBusy && savingBookingStatus === "APPROVED" ? "Approving..." : "Approve"}
                        </button>
                        <button
                          type="button"
                          className="ghost-btn"
                          disabled={isBusy}
                          onClick={() => handleBookingDecision(booking.id, "REJECTED")}
                        >
                          {isBusy && savingBookingStatus === "REJECTED" ? "Rejecting..." : "Reject"}
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="admin-facility-empty-state">No pending booking requests right now.</div>
              )}
            </div>
          </article>

          <article className="admin-facility-panel">
            <div className="admin-facility-panel-head">
              <div>
                <span className="student-modern-section-label">Maintenance Desk</span>
                <h3>Maintenance Management</h3>
                <p>Track the rooms currently marked as unavailable and bring them back online when work is complete.</p>
              </div>
            </div>

            <div className="admin-facility-maintenance-list">
              {maintenanceFacilities.length ? (
                maintenanceFacilities.map((facility) => (
                  <article key={facility.id} className="admin-facility-maintenance-card">
                    <div className="admin-facility-maintenance-head">
                      <div>
                        <strong>{facility.roomNumber}</strong>
                        <div className="admin-facility-maintenance-meta">
                          {facility.buildingName} · Floor {facility.floorNumber} · {facility.type || "Facility"}
                        </div>
                      </div>
                      <span className={`admin-facility-status-badge admin-facility-status-${facility.resolvedStatus}`}>
                        {facility.resolvedStatus === "closed" ? "Closed" : "Maintenance"}
                      </span>
                    </div>
                    <div className="admin-facility-maintenance-actions">
                      <button type="button" className="solid-btn" onClick={() => handleFacilityStatus(facility, "available")}>Restore</button>
                      <button type="button" className="ghost-btn" onClick={() => handleFacilityStatus(facility, "maintenance")}>Keep Maintenance</button>
                      <button type="button" className="ghost-btn" onClick={() => handleFacilityStatus(facility, "closed")}>Mark Closed</button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="admin-facility-empty-state">No maintenance facilities at the moment.</div>
              )}
            </div>
          </article>

          <article className="admin-facility-panel admin-facility-panel-wide">
            <div className="admin-facility-panel-head">
              <div>
                <span className="student-modern-section-label">Infrastructure</span>
                <h3>Building, Floor, and Classroom Setup</h3>
                <p>Use the existing setup tools to expand the campus structure and fine-tune room details.</p>
              </div>
            </div>

            <div className="admin-facility-setup-grid">
              <article className="admin-facility-panel admin-facility-setup-card">
                <div className="admin-facility-panel-head">
                  <div>
                    <span className="student-modern-section-label">Buildings</span>
                    <h4>Add Building</h4>
                  </div>
                </div>
                <div className="admin-facility-form-grid">
                  <label>
                    Building Name
                    <input value={buildingForm.name} onChange={(event) => setBuildingForm((current) => ({ ...current, name: event.target.value }))} />
                  </label>
                  <label>
                    Code
                    <input value={buildingForm.code} onChange={(event) => setBuildingForm((current) => ({ ...current, code: event.target.value }))} />
                  </label>
                  <label>
                    Floor Count
                    <input type="number" min="1" value={buildingForm.floorCount} onChange={(event) => setBuildingForm((current) => ({ ...current, floorCount: event.target.value }))} />
                  </label>
                </div>
                <button className="solid-btn" type="button" onClick={handleCreateBuilding}>Add Building</button>
              </article>

              <article className="admin-facility-panel admin-facility-setup-card">
                <div className="admin-facility-panel-head">
                  <div>
                    <span className="student-modern-section-label">Floors</span>
                    <h4>Update Floor Count</h4>
                  </div>
                </div>
                <div className="admin-facility-form-grid">
                  <label>
                    Building
                    <select value={floorForm.buildingId} onChange={(event) => setFloorForm((current) => ({ ...current, buildingId: event.target.value }))}>
                      <option value="">Select building</option>
                      {buildings.map((building) => (
                        <option key={building.id} value={building.id}>{building.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Floor Count
                    <input type="number" min="1" value={floorForm.floorCount} onChange={(event) => setFloorForm((current) => ({ ...current, floorCount: event.target.value }))} />
                  </label>
                </div>
                <button className="solid-btn" type="button" onClick={handleUpdateFloors}>Save Floors</button>
              </article>
            </div>

            <div className="admin-facility-panel">
              <div className="admin-facility-panel-head">
                <div>
                  <span className="student-modern-section-label">Classrooms</span>
                  <h4>Add and edit classroom details</h4>
                </div>
              </div>
              <div className="admin-facility-filter-summary">
                Selected building: {selectedBuildingName} · {formatFloorLabel(selectedFloor)}
              </div>
              <div className="admin-facility-form-grid">
                <label>
                  Building
                  <select value={classroomForm.buildingId} onChange={(event) => setClassroomForm((current) => ({ ...current, buildingId: event.target.value }))}>
                    <option value="">Select building</option>
                    {buildings.map((building) => (
                      <option key={building.id} value={building.id}>{building.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Floor
                  <input type="number" min="1" value={classroomForm.floorNumber} onChange={(event) => setClassroomForm((current) => ({ ...current, floorNumber: event.target.value }))} />
                </label>
                <label>
                  Room Number
                  <input value={classroomForm.roomNumber} onChange={(event) => setClassroomForm((current) => ({ ...current, roomNumber: event.target.value }))} />
                </label>
                <label>
                  Capacity
                  <input type="number" min="1" value={classroomForm.capacity} onChange={(event) => setClassroomForm((current) => ({ ...current, capacity: event.target.value }))} />
                </label>
                <label>
                  Type
                  <input value={classroomForm.type} onChange={(event) => setClassroomForm((current) => ({ ...current, type: event.target.value }))} />
                </label>
                <label>
                  Equipment
                  <input value={classroomForm.equipment} onChange={(event) => setClassroomForm((current) => ({ ...current, equipment: event.target.value }))} />
                </label>
              </div>
              <div className="admin-facility-inline-actions">
                <button className="solid-btn" type="button" onClick={handleCreateClassroom}>Add Classroom</button>
              </div>

              <div className="admin-facility-panel admin-facility-edit-card">
                <div className="admin-facility-panel-head">
                  <div>
                    <span className="student-modern-section-label">Selected Room</span>
                    <h4>{selectedClassroom ? selectedClassroom.roomNumber : "Select a classroom"}</h4>
                  </div>
                </div>
                {selectedClassroom ? (
                  <>
                    <div className="admin-facility-form-grid">
                      <label>
                        Room Number
                        <input value={editForm.roomNumber} onChange={(event) => setEditForm((current) => ({ ...current, roomNumber: event.target.value }))} />
                      </label>
                      <label>
                        Capacity
                        <input type="number" min="1" value={editForm.capacity} onChange={(event) => setEditForm((current) => ({ ...current, capacity: event.target.value }))} />
                      </label>
                      <label>
                        Type
                        <input value={editForm.type} onChange={(event) => setEditForm((current) => ({ ...current, type: event.target.value }))} />
                      </label>
                      <label>
                        Equipment
                        <input value={editForm.equipment} onChange={(event) => setEditForm((current) => ({ ...current, equipment: event.target.value }))} />
                      </label>
                    </div>
                    <div className="admin-facility-card-actions">
                      <button className="solid-btn" type="button" onClick={handleSaveClassroom}>Save Changes</button>
                      <button className="ghost-btn" type="button" onClick={() => handleDeleteClassroom(selectedClassroom.id)}>Delete Classroom</button>
                    </div>
                  </>
                ) : classroomLoading ? (
                  <p className="helper-text">Loading classrooms...</p>
                ) : (
                  <p className="helper-text">Choose a classroom from the table to edit its details.</p>
                )}
              </div>
            </div>
          </article>
        </div>
      </section>

      {loading ? <p className="helper-text">Refreshing admin facilities data...</p> : null}
    </PortalLayout>
  );
}

export default AdminFacilities;
