import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import PortalLayout from "../components/PortalLayout";
import "./AdminFacilities.css";
import {
  createAdminBuilding,
  createAdminClassroom,
  fetchAdminFacilitiesBuildings,
  fetchAdminFacilityBookings,
  fetchAdminFacilityReports,
  fetchAdminFloorClassrooms,
  updateAdminBookingStatus,
  updateAdminBuildingFloors,
  updateAdminClassroomStatus,
} from "../services/facilities";
import { readApiError } from "../services/api";

const DEFAULT_FACILITY_SETUP = {
  buildingId: "",
  floorNumber: 1,
  roomNumber: "",
  capacity: 30,
  type: "Lecture Hall",
  equipment: "Projector, AC",
};

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

function formatDate(value) {
  if (!value) {
    return "Not set";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(value) {
  if (!value) {
    return "Not set";
  }

  const parsed = new Date(`1970-01-01T${value}`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminFacilities() {
  const [reports, setReports] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [setupExpanded, setSetupExpanded] = useState(false);
  const [bookingActionId, setBookingActionId] = useState("");
  const [facilityActionId, setFacilityActionId] = useState("");
  const [facilityOverrides, setFacilityOverrides] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [floorFilter, setFloorFilter] = useState("ALL");

  const [buildingForm, setBuildingForm] = useState({
    name: "",
    code: "",
    floorCount: 1,
  });

  const [floorForm, setFloorForm] = useState({
    buildingId: "",
    floorCount: 1,
  });

  const [facilityForm, setFacilityForm] = useState(DEFAULT_FACILITY_SETUP);

  const loadFacilities = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [reportData, buildingData, bookingData] = await Promise.all([
        fetchAdminFacilityReports(),
        fetchAdminFacilitiesBuildings(),
        fetchAdminFacilityBookings(),
      ]);

      const normalizedBuildings = Array.isArray(buildingData) ? buildingData : [];
      setReports(reportData);
      setBuildings(normalizedBuildings);
      setBookings(Array.isArray(bookingData) ? bookingData : []);

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
                seatSelectionEnabled: room.seatSelectionEnabled,
                bookedSeats: Array.isArray(room.bookedSeats) ? room.bookedSeats : [],
                serverStatus: normalizeFacilityStatus(room.status),
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

      const firstBuildingId = normalizedBuildings[0]?.id || "";
      setFloorForm((current) => ({
        ...current,
        buildingId: current.buildingId || firstBuildingId,
      }));
      setFacilityForm((current) => ({
        ...current,
        buildingId: current.buildingId || firstBuildingId,
      }));
    } catch (err) {
      setError(readApiError(err));
      setFacilities([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  const facilityRows = useMemo(
    () =>
      facilities.map((facility) => ({
        ...facility,
        displayStatus: facilityOverrides[facility.id] || facility.serverStatus,
      })),
    [facilities, facilityOverrides]
  );

  const buildingOptions = useMemo(
    () => buildings.map((building) => ({ value: building.id, label: building.name || building.code || "Unnamed Building" })),
    [buildings]
  );

  const typeOptions = useMemo(() => {
    const values = new Set();
    facilityRows.forEach((facility) => values.add(facility.category || "Facility"));
    return Array.from(values).sort((left, right) => left.localeCompare(right));
  }, [facilityRows]);

  const floorOptions = useMemo(() => {
    const values = new Set();
    facilityRows.forEach((facility) => values.add(facility.floorNumber));
    return Array.from(values).sort((left, right) => left - right);
  }, [facilityRows]);

  const filteredFacilities = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return facilityRows.filter((facility) => {
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
  }, [buildingFilter, facilityRows, floorFilter, searchTerm, statusFilter, typeFilter]);

  const pendingBookings = useMemo(() => {
    return bookings
      .filter((booking) => (booking.status || "").toUpperCase() === "PENDING")
      .sort((left, right) => {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
        return rightTime - leftTime;
      });
  }, [bookings]);

  const maintenanceFacilities = useMemo(
    () => facilityRows.filter((facility) => facility.displayStatus === "MAINTENANCE" || facility.displayStatus === "CLOSED"),
    [facilityRows]
  );

  const facilityStatusCounts = useMemo(
    () =>
      facilityRows.reduce(
        (accumulator, facility) => {
          accumulator[facility.displayStatus] = (accumulator[facility.displayStatus] || 0) + 1;
          return accumulator;
        },
        { AVAILABLE: 0, BOOKED: 0, MAINTENANCE: 0, CLOSED: 0 }
      ),
    [facilityRows]
  );

  const analytics = useMemo(() => {
    return [
      { label: "Total Facilities", value: facilityRows.length, tone: "total" },
      { label: "Available Today", value: facilityStatusCounts.AVAILABLE || 0, tone: "available" },
      { label: "Booked Today", value: facilityStatusCounts.BOOKED || 0, tone: "booked" },
      { label: "Pending Requests", value: pendingBookings.length, tone: "pending" },
      { label: "Maintenance Facilities", value: facilityStatusCounts.MAINTENANCE || 0, tone: "maintenance" },
    ];
  }, [facilityRows.length, facilityStatusCounts, pendingBookings.length]);

  const chartPalette = {
    blue: "#4D7EDC",
    aqua: "#58C1B8",
    violet: "#6D54C9",
    coral: "#EB5D86",
    amber: "#F2AE42",
    slate: "#7F8EA8",
    mint: "#A9DFC9",
  };

  const pmStatusChartData = useMemo(() => {
    const totalClassrooms = Number(reports?.totalClassrooms || facilityRows.length || 0);
    const available = Number(facilityStatusCounts.AVAILABLE || 0);
    const booked = Number(facilityStatusCounts.BOOKED || 0);
    const maintenance = Number(facilityStatusCounts.MAINTENANCE || 0);
    const closed = Number(facilityStatusCounts.CLOSED || 0);
    const ratio = totalClassrooms > 0 ? Math.round((available / totalClassrooms) * 1000) / 10 : 0;

    return {
      ratio,
      cards: {
        totalClassrooms,
        unavailableClassrooms: Number(reports?.unavailableClassrooms || maintenance + closed),
      },
      segments: [
        { name: "Available", value: available, color: "#76B900" },
        { name: "Booked", value: booked, color: "#4D7EDC" },
        { name: "Maintenance", value: maintenance, color: "#F39E53" },
        { name: "Closed", value: closed, color: "#A675B1" },
      ],
      legendRows: [
        { label: "Available", value: available, tint: "#d9efc8" },
        { label: "Booked", value: booked, tint: "#dfe7fc" },
        { label: "Maintenance", value: maintenance, tint: "#fce6d2" },
        { label: "Unavailable", value: Number(reports?.unavailableClassrooms || maintenance + closed), tint: "#d7f0ec" },
        { label: "Closed", value: closed, tint: "#f2dde9" },
      ],
    };
  }, [facilityRows.length, facilityStatusCounts, reports]);

  const facilitiesByBuildingData = useMemo(() => {
    const byBuilding = facilityRows.reduce((accumulator, facility) => {
      const key = facility.buildingName || "Unknown";
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    const colors = [chartPalette.blue, chartPalette.aqua, chartPalette.violet, chartPalette.amber, chartPalette.coral, chartPalette.slate];
    return Object.entries(byBuilding)
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }))
      .sort((left, right) => right.value - left.value);
  }, [facilityRows]);

  const typeCapacityData = useMemo(() => {
    const byType = facilityRows.reduce((accumulator, facility) => {
      const key = facility.category || "Facility";
      if (!accumulator[key]) {
        accumulator[key] = { type: key, rooms: 0, capacity: 0 };
      }

      accumulator[key].rooms += 1;
      accumulator[key].capacity += Number(facility.capacity || 0);
      return accumulator;
    }, {});

    return Object.values(byType)
      .sort((left, right) => right.rooms - left.rooms)
      .slice(0, 8);
  }, [facilityRows]);

  const floorDistributionData = useMemo(() => {
    const byFloor = facilityRows.reduce((accumulator, facility) => {
      const key = `${facility.buildingCode || facility.buildingName || "BLD"}-F${facility.floorNumber}`;
      if (!accumulator[key]) {
        accumulator[key] = {
          floor: key,
          rooms: 0,
          totalCapacity: 0,
        };
      }

      accumulator[key].rooms += 1;
      accumulator[key].totalCapacity += Number(facility.capacity || 0);
      return accumulator;
    }, {});

    return Object.values(byFloor)
      .map((row) => ({
        ...row,
        avgCapacity: row.rooms ? Number((row.totalCapacity / row.rooms).toFixed(1)) : 0,
      }))
      .sort((left, right) => right.rooms - left.rooms)
      .slice(0, 10);
  }, [facilityRows]);

  const capacityBandData = useMemo(() => {
    const bands = [
      { label: "0-30", min: 0, max: 30, count: 0 },
      { label: "31-60", min: 31, max: 60, count: 0 },
      { label: "61-120", min: 61, max: 120, count: 0 },
      { label: "121+", min: 121, max: Number.POSITIVE_INFINITY, count: 0 },
    ];

    facilityRows.forEach((facility) => {
      const capacity = Number(facility.capacity || 0);
      const matchedBand = bands.find((band) => capacity >= band.min && capacity <= band.max);
      if (matchedBand) {
        matchedBand.count += 1;
      }
    });

    const total = facilityRows.length || 1;
    return bands.map((band) => ({
      ...band,
      percentage: Number(((band.count / total) * 100).toFixed(1)),
    }));
  }, [facilityRows]);

  const totalVisibleFacilities = filteredFacilities.length;
  const activeFiltersCount = [searchTerm, buildingFilter, typeFilter, statusFilter, floorFilter].filter((value) => value && value !== "ALL").length;

  const resetFilters = () => {
    setSearchTerm("");
    setBuildingFilter("ALL");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
    setFloorFilter("ALL");
  };

  const handleCreateBuilding = async () => {
    try {
      setError("");
      await createAdminBuilding({
        ...buildingForm,
        floorCount: Number(buildingForm.floorCount),
      });
      setBuildingForm({ name: "", code: "", floorCount: 1 });
      await loadFacilities();
    } catch (err) {
      setError(readApiError(err));
    }
  };

  const handleUpdateFloors = async () => {
    if (!floorForm.buildingId) {
      setError("Select a building before updating its floor count.");
      return;
    }

    try {
      setError("");
      await updateAdminBuildingFloors(floorForm.buildingId, {
        floorCount: Number(floorForm.floorCount),
      });
      await loadFacilities();
    } catch (err) {
      setError(readApiError(err));
    }
  };

  const handleCreateFacility = async () => {
    if (!facilityForm.buildingId) {
      setError("Select a building before creating a facility.");
      return;
    }

    try {
      setError("");
      await createAdminClassroom(facilityForm.buildingId, Number(facilityForm.floorNumber), {
        roomNumber: facilityForm.roomNumber,
        capacity: Number(facilityForm.capacity),
        type: facilityForm.type,
        equipment: facilityForm.equipment
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setFacilityForm((current) => ({
        ...DEFAULT_FACILITY_SETUP,
        buildingId: current.buildingId,
      }));
      await loadFacilities();
    } catch (err) {
      setError(readApiError(err));
    }
  };

  const handleBookingDecision = async (bookingId, status) => {
    try {
      setError("");
      setBookingActionId(bookingId);
      await updateAdminBookingStatus(
        bookingId,
        status,
        status === "REJECTED" ? "Rejected from the facility control panel" : "Approved from the facility control panel"
      );
      await loadFacilities();
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setBookingActionId("");
    }
  };

  const handleFacilityStatus = async (facility, nextStatus) => {
    try {
      setError("");
      setFacilityActionId(facility.id);

      if (nextStatus === "CLOSED") {
        setFacilityOverrides((current) => ({
          ...current,
          [facility.id]: "CLOSED",
        }));
        return;
      }

      await updateAdminClassroomStatus(facility.id, nextStatus === "AVAILABLE" ? "AVAILABLE" : "UNAVAILABLE");
      setFacilityOverrides((current) => {
        const nextOverrides = { ...current };
        delete nextOverrides[facility.id];
        return nextOverrides;
      });
      await loadFacilities();
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setFacilityActionId("");
    }
  };

  return (
    <PortalLayout
      title="Admin Facilities"
      subtitle="A soft pastel operations hub for buildings, rooms, booking requests, and maintenance control across campus."
      pageClassName="admin-facilities-page"
    >
      <div className="admin-facilities-stack">
        <section className="admin-facility-banner">
          <div className="admin-facility-banner-top">
            <div className="admin-facility-banner-copy">
              <span className="admin-facility-kicker">Facility Management</span>
              <h2>Admin Facility Control Panel</h2>
              <p>
                Manage the full room inventory, review live booking requests, and keep the campus schedule
                moving with a clean glassmorphism dashboard.
              </p>
            </div>

            <div className="admin-facility-banner-actions">
              <button type="button" className="solid-btn" onClick={() => setSetupExpanded((current) => !current)}>
                {setupExpanded ? "Hide Facility Setup" : "Add New Facility"}
              </button>
              <button type="button" className="ghost-btn" onClick={loadFacilities}>
                Refresh Data
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
              <strong>{pendingBookings.length}</strong> Pending Requests
            </span>
            <span className="admin-facility-chip">
              <strong>{maintenanceFacilities.length}</strong> Maintenance Rooms
            </span>
            <span className="admin-facility-chip">
              <strong>{reports?.totalBookings ?? 0}</strong> Total Bookings
            </span>
          </div>
        </section>

        <section className="admin-facility-stats-grid">
          {analytics.map((stat) => (
            <article key={stat.label} className={`admin-facility-stat-card admin-facility-stat-card-${stat.tone}`}>
              <div className="admin-facility-stat-icon" aria-hidden="true">
                {stat.label
                  .split(" ")
                  .slice(0, 2)
                  .map((word) => word[0])
                  .join("")}
              </div>
              <div className="admin-facility-stat-copy">
                <p className="metric-number">{stat.value}</p>
                <h3>{stat.label}</h3>
              </div>
            </article>
          ))}
        </section>

        <section className="admin-facility-chart-board">
          <article className="admin-facility-chart-card">
            <div className="admin-facility-chart-head">
              <h4>Facility Status</h4>
            </div>
            <div className="admin-facility-chart-meta-row">
              <span>Total Classrooms <strong>{pmStatusChartData.cards.totalClassrooms}</strong></span>
              <span>Unavailable Classrooms <strong>{pmStatusChartData.cards.unavailableClassrooms}</strong></span>
            </div>
            <div className="admin-facility-chart-body admin-facility-chart-body-split">
              <div className="admin-facility-chart-canvas">
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie
                      data={pmStatusChartData.segments}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={64}
                      paddingAngle={2}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {pmStatusChartData.segments.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <p className="admin-facility-chart-ring-value">{pmStatusChartData.ratio}%</p>
              </div>
              <div className="admin-facility-chart-kpi-list">
                {pmStatusChartData.legendRows.map((row) => (
                  <div key={row.label} className="admin-facility-chart-kpi-item" style={{ backgroundColor: row.tint }}>
                    <span>{row.label}</span>
                    <strong>{row.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="admin-facility-chart-card">
            <div className="admin-facility-chart-head">
              <h4>Facilities by Building</h4>
            </div>
            <div className="admin-facility-chart-meta-row">
              <span>Total Buildings <strong>{reports?.totalBuildings ?? buildings.length}</strong></span>
              <span>Active Buildings <strong>{facilitiesByBuildingData.length}</strong></span>
            </div>
            <div className="admin-facility-chart-body">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={facilitiesByBuildingData}
                    dataKey="value"
                    nameKey="name"
                    cx="42%"
                    cy="52%"
                    outerRadius={84}
                  >
                    {facilitiesByBuildingData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend layout="vertical" align="right" verticalAlign="middle" />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="admin-facility-chart-card">
            <div className="admin-facility-chart-head">
              <h4>Capacity by Facility Type</h4>
            </div>
            <div className="admin-facility-chart-body">
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={typeCapacityData} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5ebf7" />
                  <XAxis dataKey="type" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rooms" name="Rooms" fill={chartPalette.aqua} radius={[5, 5, 0, 0]} />
                  <Bar dataKey="capacity" name="Seats" fill={chartPalette.violet} radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="admin-facility-chart-card admin-facility-chart-card-wide">
            <div className="admin-facility-chart-head">
              <h4>Floor Distribution</h4>
            </div>
            <div className="admin-facility-chart-body">
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={floorDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7edf8" />
                  <XAxis dataKey="floor" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rooms" name="Rooms" fill="#9ad9cb" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="avgCapacity" name="Avg Capacity" stroke="#c74f4f" strokeWidth={2} dot={{ r: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="admin-facility-chart-card admin-facility-chart-card-wide">
            <div className="admin-facility-chart-head">
              <h4>Capacity Bands</h4>
            </div>
            <div className="admin-facility-chart-body">
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={capacityBandData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7edf8" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip formatter={(value, name) => (name === "Share" ? `${value}%` : value)} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" name="Rooms" fill="#f03f80" radius={[5, 5, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="percentage" name="Share" stroke="#3f77d2" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        {setupExpanded ? (
          <section className="admin-facility-panel admin-facility-panel-wide">
            <div className="admin-facility-panel-head">
              <div>
                <p className="student-modern-section-label">Setup Tools</p>
                <h3>Add and expand campus facilities</h3>
                <p>Keep the inventory current by adding buildings, classrooms, and floor counts from one place.</p>
              </div>
            </div>

            <div className="admin-facility-setup-grid">
              <article className="admin-facility-setup-card">
                <div className="admin-facility-panel-head">
                  <div>
                    <p className="student-modern-section-label">Buildings</p>
                    <h4>Create a new building</h4>
                  </div>
                </div>

                <div className="admin-facility-form-grid">
                  <label>
                    Building Name
                    <input
                      value={buildingForm.name}
                      onChange={(event) => setBuildingForm((current) => ({ ...current, name: event.target.value }))}
                    />
                  </label>
                  <label>
                    Code
                    <input
                      value={buildingForm.code}
                      onChange={(event) => setBuildingForm((current) => ({ ...current, code: event.target.value }))}
                    />
                  </label>
                  <label>
                    Floor Count
                    <input
                      type="number"
                      min="1"
                      value={buildingForm.floorCount}
                      onChange={(event) => setBuildingForm((current) => ({ ...current, floorCount: event.target.value }))}
                    />
                  </label>
                </div>

                <button type="button" className="solid-btn" onClick={handleCreateBuilding}>
                  Add Building
                </button>
              </article>

              <article className="admin-facility-setup-card">
                <div className="admin-facility-panel-head">
                  <div>
                    <p className="student-modern-section-label">Facilities</p>
                    <h4>Create a new room</h4>
                  </div>
                </div>

                <div className="admin-facility-form-grid">
                  <label>
                    Building
                    <select
                      value={facilityForm.buildingId}
                      onChange={(event) => setFacilityForm((current) => ({ ...current, buildingId: event.target.value }))}
                    >
                      <option value="">Select building</option>
                      {buildingOptions.map((building) => (
                        <option key={building.value} value={building.value}>
                          {building.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Floor
                    <input
                      type="number"
                      min="1"
                      value={facilityForm.floorNumber}
                      onChange={(event) => setFacilityForm((current) => ({ ...current, floorNumber: event.target.value }))}
                    />
                  </label>
                  <label>
                    Room Number
                    <input
                      value={facilityForm.roomNumber}
                      onChange={(event) => setFacilityForm((current) => ({ ...current, roomNumber: event.target.value }))}
                    />
                  </label>
                  <label>
                    Capacity
                    <input
                      type="number"
                      min="1"
                      value={facilityForm.capacity}
                      onChange={(event) => setFacilityForm((current) => ({ ...current, capacity: event.target.value }))}
                    />
                  </label>
                  <label>
                    Facility Type
                    <input
                      value={facilityForm.type}
                      onChange={(event) => setFacilityForm((current) => ({ ...current, type: event.target.value }))}
                    />
                  </label>
                  <label>
                    Equipment
                    <input
                      value={facilityForm.equipment}
                      onChange={(event) => setFacilityForm((current) => ({ ...current, equipment: event.target.value }))}
                    />
                  </label>
                </div>

                <button type="button" className="solid-btn" onClick={handleCreateFacility}>
                  Add Facility
                </button>
              </article>

              <article className="admin-facility-setup-card">
                <div className="admin-facility-panel-head">
                  <div>
                    <p className="student-modern-section-label">Floors</p>
                    <h4>Expand a building</h4>
                  </div>
                </div>

                <div className="admin-facility-form-grid">
                  <label>
                    Building
                    <select
                      value={floorForm.buildingId}
                      onChange={(event) => setFloorForm((current) => ({ ...current, buildingId: event.target.value }))}
                    >
                      <option value="">Select building</option>
                      {buildingOptions.map((building) => (
                        <option key={building.value} value={building.value}>
                          {building.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Floor Count
                    <input
                      type="number"
                      min="1"
                      value={floorForm.floorCount}
                      onChange={(event) => setFloorForm((current) => ({ ...current, floorCount: event.target.value }))}
                    />
                  </label>
                </div>

                <button type="button" className="ghost-btn" onClick={handleUpdateFloors}>
                  Save Floor Count
                </button>
              </article>
            </div>
          </section>
        ) : null}

        <div className="admin-facility-grid">
          <section className="admin-facility-panel">
            <div className="admin-facility-panel-head">
              <div>
                <p className="student-modern-section-label">Facility Table</p>
                <h3>Manage campus facilities</h3>
                <p>
                  {totalVisibleFacilities} facilities shown{activeFiltersCount ? ` with ${activeFiltersCount} active filter${activeFiltersCount === 1 ? "" : "s"}` : ""}.
                </p>
              </div>

              <button type="button" className="ghost-btn" onClick={resetFilters} disabled={!activeFiltersCount}>
                Clear Filters
              </button>
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
              <p className="helper-text">Loading facility control data...</p>
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
                                onClick={() => handleFacilityStatus(facility, "AVAILABLE")}
                              >
                                {displayStatus === "AVAILABLE" ? "Available" : "Mark Available"}
                              </button>
                              <button
                                type="button"
                                className="admin-facility-mini-btn admin-facility-mini-btn-maintenance"
                                disabled={isBusy && displayStatus === "MAINTENANCE"}
                                onClick={() => handleFacilityStatus(facility, "MAINTENANCE")}
                              >
                                {displayStatus === "MAINTENANCE" ? "Under Maintenance" : "Maintenance"}
                              </button>
                              <button
                                type="button"
                                className="admin-facility-mini-btn admin-facility-mini-btn-closed"
                                disabled={isBusy && displayStatus === "CLOSED"}
                                onClick={() => handleFacilityStatus(facility, "CLOSED")}
                              >
                                {displayStatus === "CLOSED" ? "Closed" : "Close"}
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

          <aside className="admin-facilities-stack">
            <article className="admin-facility-panel">
              <div className="admin-facility-panel-head">
                <div>
                  <p className="student-modern-section-label">Pending Requests</p>
                  <h3>Review booking approvals</h3>
                </div>
              </div>

              <div className="admin-facility-pending-list">
                {pendingBookings.length ? (
                  pendingBookings.map((booking) => {
                    const isBusy = bookingActionId === booking.id;

                    return (
                      <article key={booking.id} className="admin-facility-request-card">
                        <div className="admin-facility-request-head">
                          <div>
                            <strong>{booking.roomNumber}</strong>
                            <div className="admin-facility-request-meta">
                              {booking.buildingName} · Floor {booking.floorNumber}
                            </div>
                          </div>
                          <span className="admin-facility-status-badge admin-facility-status-booked">Pending</span>
                        </div>

                        <div className="admin-facility-request-meta">
                          <div>{booking.requestedByName || "Unknown requester"}</div>
                          <div>
                            {formatDate(booking.bookingDate)} · {formatTime(booking.startTime)} to {formatTime(booking.endTime)}
                          </div>
                          <div>Purpose: {booking.purpose || "General booking"}</div>
                          <div>Priority: {formatDisplayLabel(booking.priority || "NORMAL")}</div>
                          {booking.decisionNote ? <div>Note: {booking.decisionNote}</div> : null}
                        </div>

                        <div className="admin-facility-request-actions">
                          <button
                            type="button"
                            className="solid-btn"
                            disabled={isBusy}
                            onClick={() => handleBookingDecision(booking.id, "APPROVED")}
                          >
                            {isBusy ? "Approving..." : "Approve"}
                          </button>
                          <button
                            type="button"
                            className="ghost-btn"
                            disabled={isBusy}
                            onClick={() => handleBookingDecision(booking.id, "REJECTED")}
                          >
                            {isBusy ? "Rejecting..." : "Reject"}
                          </button>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="admin-facility-empty-state">
                    <p>No pending booking requests at the moment.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="admin-facility-panel">
              <div className="admin-facility-panel-head">
                <div>
                  <p className="student-modern-section-label">Maintenance</p>
                  <h3>Maintenance management</h3>
                </div>
              </div>

              <div className="admin-facility-maintenance-list">
                {maintenanceFacilities.length ? (
                  maintenanceFacilities.map((facility) => {
                    const isBusy = facilityActionId === facility.id;

                    return (
                      <article key={facility.id} className="admin-facility-maintenance-card">
                        <div className="admin-facility-maintenance-head">
                          <div>
                            <strong>{facility.name}</strong>
                            <div className="admin-facility-maintenance-meta">
                              {facility.buildingName} · Floor {facility.floorNumber} · {facility.category}
                            </div>
                          </div>
                          <span className={`admin-facility-status-badge admin-facility-status-${facility.displayStatus.toLowerCase()}`}>
                            {formatDisplayLabel(facility.displayStatus)}
                          </span>
                        </div>

                        <div className="admin-facility-maintenance-meta">
                          Capacity: {facility.capacity} seats
                        </div>

                        <div className="admin-facility-maintenance-actions">
                          <button
                            type="button"
                            className="solid-btn"
                            disabled={isBusy}
                            onClick={() => handleFacilityStatus(facility, "AVAILABLE")}
                          >
                            {isBusy ? "Saving..." : "Mark Available"}
                          </button>
                          <button
                            type="button"
                            className="ghost-btn"
                            disabled={isBusy}
                            onClick={() => handleFacilityStatus(facility, "CLOSED")}
                          >
                            {isBusy ? "Saving..." : "Close Facility"}
                          </button>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="admin-facility-empty-state">
                    <p>No facilities are currently marked for maintenance.</p>
                  </div>
                )}
              </div>
            </article>
          </aside>
        </div>

        {loading ? <p className="helper-text">Refreshing admin facility data...</p> : null}
      </div>
    </PortalLayout>
  );
}

export default AdminFacilities;