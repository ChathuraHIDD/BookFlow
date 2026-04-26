import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
import "./AdminBookingManagement.css";
import {
  fetchAdminFacilityBookingAudit,
  fetchAdminFacilityBookings,
  updateAdminBookingStatus,
} from "../services/facilities";
import {
  fetchAdminResourceBookingAudit,
  fetchAdminResourceBookings,
  updateAdminResourceBookingStatus,
} from "../services/resources";
import { readApiError } from "../services/api";

function AdminBookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const [savingStatus, setSavingStatus] = useState("");
  const [savingBookingId, setSavingBookingId] = useState("");

  const [selectedBookingAudit, setSelectedBookingAudit] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const [facilityData, resourceData] = await Promise.all([
        fetchAdminFacilityBookings(),
        fetchAdminResourceBookings(),
      ]);

      const normalizedResourceData = (resourceData || []).map((b) => ({
        ...b,
        isResource: true,
        buildingName: b.resourceCategory || "Resource",
        roomNumber: b.resourceName || "Generic",
        floorNumber: "",
        priority: "NORMAL",
        purpose: "General Resource Usage",
      }));

      const getSortTime = (booking) => {
        const createdAt = booking?.createdAt ? new Date(booking.createdAt).getTime() : Number.NaN;
        if (!Number.isNaN(createdAt)) return createdAt;
        const bookingDate = booking?.bookingDate ? new Date(booking.bookingDate).getTime() : Number.NaN;
        if (!Number.isNaN(bookingDate)) return bookingDate;
        return 0;
      };

      const combined = [...(facilityData || []), ...normalizedResourceData];
      combined.sort((a, b) => getSortTime(b) - getSortTime(a));

      setBookings(combined);
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookingAudit = useCallback(async (booking) => {
    if (!booking?.id) return;
    try {
      setAuditLoading(true);
      setAuditError("");
      const timeline = booking.isResource
        ? await fetchAdminResourceBookingAudit(booking.id)
        : await fetchAdminFacilityBookingAudit(booking.id);
      setSelectedBookingAudit(Array.isArray(timeline) ? timeline : []);
    } catch (err) {
      setAuditError(readApiError(err));
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const selectedBooking = useMemo(
    () => bookings.find((b) => b.id === selectedBookingId) || null,
    [bookings, selectedBookingId]
  );

  useEffect(() => {
    if (selectedBooking) loadBookingAudit(selectedBooking);
  }, [selectedBooking, loadBookingAudit]);

  const dateRangeOptions = [
    { key: "ALL", label: "All time" },
    { key: "TODAY", label: "Today" },
    { key: "WEEK", label: "This week" },
    { key: "MONTH", label: "This month" },
  ];

  const matchesDateRange = (booking, rangeKey) => {
    if (rangeKey === "ALL") return true;
    const base = booking?.bookingDate || booking?.createdAt;
    if (!base) return false;
    const bookingTime = new Date(base);
    if (Number.isNaN(bookingTime.getTime())) return false;

    const now = new Date();
    if (rangeKey === "TODAY") return bookingTime.toDateString() === now.toDateString();
    if (rangeKey === "WEEK") {
      const currentDay = now.getDay();
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
      const weekStart = new Date(now);
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(now.getDate() + mondayOffset);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      return bookingTime >= weekStart && bookingTime < weekEnd;
    }
    if (rangeKey === "MONTH") {
      return bookingTime.getFullYear() === now.getFullYear() && bookingTime.getMonth() === now.getMonth();
    }
    return true;
  };

  const filteredBookings = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return bookings.filter((booking) => {
      const searchableText = [
        booking.requestedByName,
        booking.buildingName,
        booking.roomNumber,
        booking.status,
        booking.purpose,
        booking.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (normalizedSearch && !searchableText.includes(normalizedSearch)) return false;
      if (statusFilter !== "ALL" && (booking.status || "").toUpperCase() !== statusFilter) return false;
      if (!matchesDateRange(booking, dateRangeFilter)) return false;
      return true;
    });
  }, [bookings, searchTerm, statusFilter, dateRangeFilter]);

  const stats = useMemo(() => {
    const counters = { PENDING: 0, APPROVED: 0, REJECTED: 0, CANCELLED: 0, URGENT: 0, FACILITY: 0, RESOURCE: 0 };
    bookings.forEach((b) => {
      const status = (b.status || "").toUpperCase();
      if (counters[status] !== undefined) counters[status]++;
      if ((b.priority || "").toUpperCase() === "URGENT") counters.URGENT++;
      if (b.isResource) counters.RESOURCE++; else counters.FACILITY++;
    });
    return counters;
  }, [bookings]);

  const statusPieData = useMemo(() => [
    { name: "Pending", value: stats.PENDING, color: "#F2AE42" },
    { name: "Approved", value: stats.APPROVED, color: "#58C1B8" },
    { name: "Rejected", value: stats.REJECTED, color: "#EB5D86" },
    { name: "Cancelled", value: stats.CANCELLED, color: "#7F8EA8" },
  ].filter(d => d.value > 0), [stats]);

  const categoryBarData = useMemo(() => {
    const categories = {};
    bookings.forEach(b => {
      const cat = b.isResource ? b.resourceCategory : (b.buildingName || "Facility");
      categories[cat] = (categories[cat] || 0) + 1;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 6);
  }, [bookings]);

  const handleStatusUpdate = async (booking, status, note = "") => {
    const finalNote = (note || decisionNote).trim();
    if (status === "REJECTED" && !finalNote) {
      setDecisionError("Please provide a rejection reason.");
      return;
    }
    setDecisionError("");
    setSavingStatus(status);
    setSavingBookingId(booking.id);
    try {
      if (booking.isResource) {
        await updateAdminResourceBookingStatus(booking.id, status, finalNote);
      } else {
        await updateAdminBookingStatus(booking.id, status, finalNote);
      }
      setDecisionNote("");
      setSelectedBookingId("");
      await loadBookings();
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setSavingStatus("");
      setSavingBookingId("");
    }
  };

  const closeBookingDetails = () => {
    setSelectedBookingId("");
    setDecisionNote("");
    setDecisionError("");
    setSelectedBookingAudit([]);
  };

  return (
    <PortalLayout
      title="Booking Management"
      subtitle="Comprehensive administrative control over all campus facility and resource booking requests."
      pageClassName="admin-bookings-page"
    >
      <div className="admin-bookings-stack">
        <section className="admin-booking-banner">
          <div className="admin-booking-banner-top">
            <div className="admin-booking-banner-copy">
              <span className="admin-booking-kicker">Administrative Hub</span>
              <h2>Central Booking Queue</h2>
              <p>Review and manage booking requests from students across all campus resources and facilities.</p>
            </div>
            <div className="admin-booking-banner-actions">
              <button type="button" className="solid-btn" onClick={loadBookings}>Refresh Queue</button>
              <button type="button" className="ghost-btn" onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); setDateRangeFilter("ALL"); }}>Clear Filters</button>
            </div>
          </div>
          <div className="admin-booking-chip-row">
            <span className="admin-booking-chip"><strong>{bookings.length}</strong> Total</span>
            <span className="admin-booking-chip"><strong>{stats.PENDING}</strong> Pending</span>
            <span className="admin-booking-chip"><strong>{stats.URGENT}</strong> Urgent</span>
            <span className="admin-booking-chip"><strong>{stats.FACILITY}</strong> Facilities</span>
            <span className="admin-booking-chip"><strong>{stats.RESOURCE}</strong> Resources</span>
          </div>
        </section>

        <section className="admin-booking-stats-grid">
          <article className="admin-booking-stat-card admin-booking-stat-card-total">
            <div className="admin-booking-stat-icon">ALL</div>
            <div className="admin-booking-stat-copy"><p className="metric-number">{bookings.length}</p><h3>Requests</h3></div>
          </article>
          <article className="admin-booking-stat-card admin-booking-stat-card-pending">
            <div className="admin-booking-stat-icon">QUE</div>
            <div className="admin-booking-stat-copy"><p className="metric-number">{stats.PENDING}</p><h3>Review Needed</h3></div>
          </article>
          <article className="admin-booking-stat-card admin-booking-stat-card-urgent">
            <div className="admin-booking-stat-icon">TOP</div>
            <div className="admin-booking-stat-copy"><p className="metric-number">{stats.URGENT}</p><h3>High Priority</h3></div>
          </article>
          <article className="admin-booking-stat-card admin-booking-stat-card-facility">
            <div className="admin-booking-stat-icon">FAC</div>
            <div className="admin-booking-stat-copy"><p className="metric-number">{stats.FACILITY}</p><h3>Facility Use</h3></div>
          </article>
          <article className="admin-booking-stat-card admin-booking-stat-card-resource">
            <div className="admin-booking-stat-icon">RES</div>
            <div className="admin-booking-stat-copy"><p className="metric-number">{stats.RESOURCE}</p><h3>Resource Use</h3></div>
          </article>
        </section>

        <section className="admin-booking-chart-board">
          <article className="admin-booking-chart-card">
            <div className="admin-booking-chart-head"><h4>Status Distribution</h4></div>
            <div className="admin-booking-chart-body admin-booking-chart-body-split">
              <div className="admin-booking-chart-canvas">
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={statusPieData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3}>
                      {statusPieData.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="admin-booking-chart-kpi-list">
                {statusPieData.map(d => (
                  <div key={d.name} className="admin-booking-chart-kpi-item" style={{ backgroundColor: d.color + '15' }}>
                    <span>{d.name}</span><strong>{d.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="admin-booking-chart-card admin-booking-chart-card-wide">
            <div className="admin-booking-chart-head"><h4>Bookings by Building/Category</h4></div>
            <div className="admin-booking-chart-body">
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={categoryBarData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f3fa" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Bookings" fill="#5c8dea" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <section className="admin-booking-panel">
          <div className="admin-booking-panel-head">
            <div>
              <h3>Management Queue</h3>
              <p>Showing {filteredBookings.length} results from {bookings.length} total bookings.</p>
            </div>
            <div className="admin-booking-filter-bar">
              <label className="admin-booking-filter-field">Search<input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Requester or room..." /></label>
              <label className="admin-booking-filter-field">Status
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </label>
              <label className="admin-booking-filter-field">Time Range
                <select value={dateRangeFilter} onChange={e => setDateRangeFilter(e.target.value)}>
                  {dateRangeOptions.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="admin-booking-table-wrap">
            <table className="admin-booking-table">
              <thead>
                <tr>
                  <th>Requester</th>
                  <th>Resource/Facility</th>
                  <th>Booking Date</th>
                  <th>Time Slot</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map(b => (
                  <tr key={b.id} onClick={() => setSelectedBookingId(b.id)}>
                    <td>
                      <div className="admin-booking-table-main">
                        <strong>{b.requestedByName}</strong>
                        <span>{b.userId}</span>
                      </div>
                    </td>
                    <td>
                      <div className="admin-booking-table-main">
                        <strong>{b.roomNumber}</strong>
                        <span>{b.buildingName} {b.floorNumber ? `· Floor ${b.floorNumber}` : ''}</span>
                      </div>
                    </td>
                    <td><span className="admin-booking-table-meta">{b.bookingDate}</span></td>
                    <td><span className="admin-booking-table-meta">{b.startTime} - {b.endTime}</span></td>
                    <td>
                      <span className={`admin-booking-status-badge admin-booking-status-${(b.status || '').toLowerCase()}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-booking-table-actions" onClick={e => e.stopPropagation()}>
                        {b.status === 'PENDING' && (
                          <>
                            <button className="admin-booking-mini-btn admin-booking-mini-btn-approve" onClick={() => handleStatusUpdate(b, 'APPROVED', 'Quick Approved')}>Approve</button>
                            <button className="admin-booking-mini-btn admin-booking-mini-btn-reject" onClick={() => setSelectedBookingId(b.id)}>Reject</button>
                          </>
                        )}
                        {b.status === 'APPROVED' && (
                          <button className="admin-booking-mini-btn" onClick={() => handleStatusUpdate(b, 'CANCELLED', 'Admin Cancelled')}>Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {selectedBooking && createPortal(
          <div className="admin-booking-modal-overlay" onClick={e => e.target === e.currentTarget && closeBookingDetails()}>
            <aside className="admin-booking-detail-modal">
              <div className="admin-booking-modal-head">
                <div>
                  <p className="student-modern-section-label">{selectedBooking.isResource ? "Resource" : "Facility"} Request</p>
                  <h3>{selectedBooking.buildingName} · {selectedBooking.roomNumber}</h3>
                </div>
                <button className="ghost-btn" onClick={closeBookingDetails}>Close</button>
              </div>
              
              <div className="admin-booking-detail-grid">
                <div className="admin-booking-detail-item"><label>Student</label><strong>{selectedBooking.requestedByName}</strong></div>
                <div className="admin-booking-detail-item"><label>Purpose</label><strong>{selectedBooking.purpose || "General"}</strong></div>
                <div className="admin-booking-detail-item"><label>Date</label><strong>{selectedBooking.bookingDate}</strong></div>
                <div className="admin-booking-detail-item"><label>Time Slot</label><strong>{selectedBooking.startTime} - {selectedBooking.endTime}</strong></div>
              </div>

              {selectedBooking.status === "PENDING" && (
                <div className="admin-booking-decision-box">
                  <label>Review Decision</label>
                  <textarea 
                    rows={3}
                    value={decisionNote}
                    onChange={e => setDecisionNote(e.target.value)}
                    placeholder="Enter reason for approval or rejection (required for reject)..."
                  />
                  {decisionError && <p className="error-text" style={{ marginBottom: "12px" }}>{decisionError}</p>}
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button className="solid-btn" onClick={() => handleStatusUpdate(selectedBooking, "APPROVED")}>Approve Request</button>
                    <button className="ghost-btn" onClick={() => handleStatusUpdate(selectedBooking, "REJECTED")}>Reject Request</button>
                  </div>
                </div>
              )}

              <div className="admin-booking-audit-section">
                <h5>Audit Timeline</h5>
                {auditLoading ? <p className="helper-text">Loading history...</p> : (
                  <div className="admin-booking-audit-timeline">
                    {selectedBookingAudit.length ? selectedBookingAudit.map(a => (
                      <div key={a.id} className="admin-booking-audit-event">
                        <strong>{a.action}</strong>
                        <div className="event-meta">
                          {a.newStatus} · {a.actorName || "System"} · {new Date(a.timestamp).toLocaleString()}
                        </div>
                        {a.reason && <div className="event-reason">"{a.reason}"</div>}
                      </div>
                    )) : <p className="helper-text">No history recorded yet.</p>}
                  </div>
                )}
              </div>
            </aside>
          </div>,
          document.body
        )}
      </div>
    </PortalLayout>
  );
}

export default AdminBookingManagement;
