import { useEffect, useState } from "react";

import PortalLayout from "../components/PortalLayout";
import {
  createAdminBuilding,
  createAdminClassroom,
  deleteAdminClassroom,
  fetchAdminFacilitiesBuildings,
  fetchAdminFacilityBookings,
  fetchAdminFacilityReports,
  fetchAdminFloorClassrooms,
  updateAdminBookingStatus,
  updateAdminBuildingFloors,
  updateAdminClassroom,
  updateAdminClassroomStatus,
} from "../services/facilities";
import { readApiError } from "../services/api";

function AdminFacilities() {
  const [reports, setReports] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classroomLoading, setClassroomLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("1");
  const [editingClassroomId, setEditingClassroomId] = useState("");

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
      setBookings(bookingData);

      const firstBuildingId = selectedBuildingId || buildingData[0]?.id || "";
      const firstFloorCount = buildingData.find((item) => item.id === firstBuildingId)?.floorCount || 1;
      setSelectedBuildingId(firstBuildingId);
      setSelectedFloor((current) => {
        const safeFloor = Math.min(Number(current) || 1, firstFloorCount);
        return String(safeFloor);
      });

      setFloorForm((current) => ({
        ...current,
        buildingId: current.buildingId || firstBuildingId,
      }));

      setClassroomForm((current) => ({
        ...current,
        buildingId: current.buildingId || firstBuildingId,
        floorNumber: current.floorNumber || 1,
      }));
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
      await loadClassrooms(selectedBuildingId, selectedFloor);
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
      await loadClassrooms(selectedBuildingId, selectedFloor);
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
      await loadClassrooms(selectedBuildingId, selectedFloor);
      await loadAdminData();
    } catch (err) {
      setError(readApiError(err));
    }
  };

  const handleBookingStatus = async (bookingId, status) => {
    try {
      await updateAdminBookingStatus(bookingId, status);
      await loadAdminData();
    } catch (err) {
      setError(readApiError(err));
    }
  };

  const handleClassroomStatus = async (classroomId, status) => {
    try {
      await updateAdminClassroomStatus(classroomId, status);
      await loadClassrooms(selectedBuildingId, selectedFloor);
      await loadAdminData();
    } catch (err) {
      setError(readApiError(err));
    }
  };

  const selectedClassroom = classrooms.find((item) => item.id === editingClassroomId);

  return (
    <PortalLayout
      title="Admin Facilities"
      subtitle="Manage buildings, floors, classrooms, room availability, and booking approvals in one admin-only workspace."
    >
      {error ? <p className="error-text">{error}</p> : null}

      {reports ? (
        <section className="stats-grid">
          <article className="metric-card">
            <h3>Total Buildings</h3>
            <p className="metric-number">{reports.totalBuildings}</p>
          </article>
          <article className="metric-card">
            <h3>Total Classrooms</h3>
            <p className="metric-number">{reports.totalClassrooms}</p>
          </article>
          <article className="metric-card">
            <h3>Total Bookings</h3>
            <p className="metric-number">{reports.totalBookings}</p>
          </article>
          <article className="metric-card">
            <h3>Pending Bookings</h3>
            <p className="metric-number">{reports.pendingBookings}</p>
          </article>
          <article className="metric-card">
            <h3>Unavailable Rooms</h3>
            <p className="metric-number">{reports.unavailableClassrooms}</p>
          </article>
        </section>
      ) : null}

      <section className="student-facilities-grid admin-facilities-grid">
        <article className="student-modern-workspace-card">
          <div className="student-modern-card-head">
            <div>
              <p className="student-modern-section-label">Buildings</p>
              <h3>Add Building</h3>
            </div>
          </div>
          <div className="form-grid">
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
            <button className="solid-btn" type="button" onClick={handleCreateBuilding}>Add Building</button>
          </div>
        </article>

        <article className="student-modern-workspace-card">
          <div className="student-modern-card-head">
            <div>
              <p className="student-modern-section-label">Floors</p>
              <h3>Update Floor Count</h3>
            </div>
          </div>
          <div className="form-grid">
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
            <button className="solid-btn" type="button" onClick={handleUpdateFloors}>Save Floors</button>
          </div>
        </article>

        <article className="student-modern-workspace-card student-facilities-wide-card">
          <div className="student-modern-card-head">
            <div>
              <p className="student-modern-section-label">Classrooms</p>
              <h3>Add Classroom</h3>
            </div>
          </div>
          <div className="admin-classroom-form-grid">
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
          <div className="cta-row">
            <button className="solid-btn" type="button" onClick={handleCreateClassroom}>Add Classroom</button>
          </div>
        </article>

        <article className="student-modern-workspace-card student-facilities-wide-card">
          <div className="student-modern-card-head">
            <div>
              <p className="student-modern-section-label">Manage Rooms</p>
              <h3>Update Classroom Details and Status</h3>
            </div>
          </div>

          <div className="student-facility-filter-row">
            <select value={selectedBuildingId} onChange={(event) => setSelectedBuildingId(event.target.value)}>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>{building.name}</option>
              ))}
            </select>
            <input type="number" min="1" value={selectedFloor} onChange={(event) => setSelectedFloor(event.target.value)} />
          </div>

          <div className="admin-facility-management-grid">
            <div className="student-facility-detail-grid">
              {classroomLoading ? (
                <p className="helper-text">Loading classrooms...</p>
              ) : classrooms.length ? (
                classrooms.map((classroom) => (
                  <article key={classroom.id} className="student-facility-card">
                    <div className="student-facility-card-top">
                      <div>
                        <h4>{classroom.roomNumber}</h4>
                        <p>{classroom.type}</p>
                      </div>
                      <span className={`student-facility-status student-facility-status-${classroom.status.toLowerCase()}`}>
                        {classroom.status}
                      </span>
                    </div>
                    <div className="student-facility-meta">
                      <span>{classroom.capacity} seats</span>
                    </div>
                    <div className="student-facility-action-list">
                      <button className="solid-btn" type="button" onClick={() => setEditingClassroomId(classroom.id)}>
                        Edit
                      </button>
                      <button className="ghost-btn" type="button" onClick={() => handleClassroomStatus(classroom.id, "AVAILABLE")}>
                        Mark Available
                      </button>
                      <button className="ghost-btn" type="button" onClick={() => handleClassroomStatus(classroom.id, "UNAVAILABLE")}>
                        Mark Unavailable
                      </button>
                      <button className="ghost-btn" type="button" onClick={() => handleDeleteClassroom(classroom.id)}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="helper-text">No classrooms on this floor yet.</p>
              )}
            </div>

            <div className="student-modern-workspace-card admin-classroom-edit-card">
              <div className="student-modern-card-head">
                <div>
                  <p className="student-modern-section-label">Edit Classroom</p>
                  <h3>{selectedClassroom ? selectedClassroom.roomNumber : "Select a classroom"}</h3>
                </div>
              </div>

              {selectedClassroom ? (
                <>
                  <div className="form-grid">
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
                  <div className="student-facility-action-list">
                    <button className="solid-btn" type="button" onClick={handleSaveClassroom}>Save Changes</button>
                    <button className="ghost-btn" type="button" onClick={() => handleDeleteClassroom(selectedClassroom.id)}>Delete Classroom</button>
                  </div>
                </>
              ) : (
                <p className="helper-text">Choose a classroom from the list to edit its details.</p>
              )}
            </div>
          </div>
        </article>

        <article className="student-modern-workspace-card student-facilities-wide-card">
          <div className="student-modern-card-head">
            <div>
              <p className="student-modern-section-label">Bookings</p>
              <h3>Approve, Reject, or Cancel Requests</h3>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Requester</th>
                  <th>Building</th>
                  <th>Room</th>
                  <th>Date</th>
                  <th>Slot</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.requestedByName}</td>
                    <td>{booking.buildingName}</td>
                    <td>{booking.roomNumber}</td>
                    <td>{booking.bookingDate}</td>
                    <td>{booking.startTime} - {booking.endTime}</td>
                    <td>{booking.status}</td>
                    <td className="admin-facilities-actions">
                      <button className="solid-btn" type="button" onClick={() => handleBookingStatus(booking.id, "APPROVED")}>Approve</button>
                      <button className="ghost-btn" type="button" onClick={() => handleBookingStatus(booking.id, "REJECTED")}>Reject</button>
                      <button className="ghost-btn" type="button" onClick={() => handleBookingStatus(booking.id, "CANCELLED")}>Cancel</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      {loading ? <p className="helper-text">Refreshing admin facilities data...</p> : null}
    </PortalLayout>
  );
}

export default AdminFacilities;
