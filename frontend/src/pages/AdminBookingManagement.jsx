import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/useAuth";
import { fetchAdminFacilityBookings, updateAdminBookingStatus } from "../services/facilities";
import { fetchAdminResourceBookings, updateAdminResourceBookingStatus } from "../services/resources";
import { readApiError } from "../services/api";

const ADMIN_ACTION_LOG_KEY = "admin_booking_action_log";
const PAGE_SIZE = 3;

function AdminBookingManagement() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState("ALL");
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const [savingStatus, setSavingStatus] = useState("");
  const [savingBookingId, setSavingBookingId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLogByBooking, setActionLogByBooking] = useState(() => {
    try {
      const raw = sessionStorage.getItem(ADMIN_ACTION_LOG_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");
      
      const [facilityData, resourceData] = await Promise.all([
        fetchAdminFacilityBookings(),
        fetchAdminResourceBookings()
      ]);

      const normalizedResourceData = (resourceData || []).map(b => ({
        ...b,
        isResource: true,
        buildingName: b.resourceCategory,
        roomNumber: b.resourceName,
        floorNumber: ""
      }));

      const combined = [...(facilityData || []), ...normalizedResourceData];
      
      // Sort review-needed and urgent requests first, then by date descending
      combined.sort((a, b) => {
        if (Boolean(a.reviewRequired) && !Boolean(b.reviewRequired)) return -1;
        if (!Boolean(a.reviewRequired) && Boolean(b.reviewRequired)) return 1;
        if ((a.priority || "NORMAL") === "URGENT" && (b.priority || "NORMAL") !== "URGENT") return -1;
        if ((a.priority || "NORMAL") !== "URGENT" && (b.priority || "NORMAL") === "URGENT") return 1;
        if (a.status === "PENDING" && b.status !== "PENDING") return -1;
        if (a.status !== "PENDING" && b.status === "PENDING") return 1;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });

      setBookings(combined);
      setSelectedBookingId((current) =>
        current && combined.some((booking) => booking.id === current) ? current : ""
      );
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    sessionStorage.setItem(ADMIN_ACTION_LOG_KEY, JSON.stringify(actionLogByBooking));
  }, [actionLogByBooking]);

  useEffect(() => {
    if (!selectedBookingId) {
      return;
    }

    const onEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedBookingId("");
        setDecisionNote("");
        setDecisionError("");
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [selectedBookingId]);

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.id === selectedBookingId) || null,
    [bookings, selectedBookingId]
  );

  const selectedBookingActionLog = useMemo(
    () => (selectedBooking ? actionLogByBooking[selectedBooking.id] || null : null),
    [actionLogByBooking, selectedBooking]
  );

  const dateRangeOptions = [
    { key: "ALL", label: "All time" },
    { key: "TODAY", label: "Today" },
    { key: "WEEK", label: "This week" },
    { key: "MONTH", label: "This month" },
  ];

  const getBookingTimestamp = (booking) => {
    const base = booking?.bookingDate || booking?.createdAt;
    if (!base) return null;
    const parsed = new Date(base);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const matchesDateRange = (booking, rangeKey) => {
    if (rangeKey === "ALL") return true;

    const bookingTime = getBookingTimestamp(booking);
    if (!bookingTime) return false;

    const now = new Date();

    if (rangeKey === "TODAY") {
      return bookingTime.toDateString() === now.toDateString();
    }

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
      return (
        bookingTime.getFullYear() === now.getFullYear() &&
        bookingTime.getMonth() === now.getMonth()
      );
    }

    return true;
  };

  const timeFilteredBookings = useMemo(
    () => bookings.filter((booking) => matchesDateRange(booking, dateRangeFilter)),
    [bookings, dateRangeFilter]
  );

  const filteredBookings = useMemo(() => {
    if (statusFilter === "ALL") {
      return timeFilteredBookings;
    }
    return timeFilteredBookings.filter(
      (booking) => (booking.status || "").toUpperCase() === statusFilter
    );
  }, [timeFilteredBookings, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, dateRangeFilter]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE)),
    [filteredBookings.length]
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredBookings.slice(start, start + PAGE_SIZE);
  }, [filteredBookings, currentPage]);

  const pageStart = filteredBookings.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const pageEnd = filteredBookings.length ? Math.min(currentPage * PAGE_SIZE, filteredBookings.length) : 0;

  useEffect(() => {
    if (selectedBookingId && !filteredBookings.some((booking) => booking.id === selectedBookingId)) {
      closeBookingDetails();
    }
  }, [filteredBookings, selectedBookingId]);

  const bookingStatusSummary = useMemo(() => {
    const counters = {
      APPROVED: 0,
      REJECTED: 0,
      PENDING: 0,
    };

    timeFilteredBookings.forEach((booking) => {
      const normalized = (booking.status || "").toUpperCase();
      if (Object.prototype.hasOwnProperty.call(counters, normalized)) {
        counters[normalized] += 1;
      }
    });

    return [
      { key: "APPROVED", label: "Approved", tone: "approved", count: counters.APPROVED },
      { key: "REJECTED", label: "Rejected", tone: "rejected", count: counters.REJECTED },
      { key: "PENDING", label: "Pending", tone: "pending", count: counters.PENDING },
    ];
  }, [timeFilteredBookings]);

  const maxBookingStatusCount = useMemo(
    () => Math.max(1, ...bookingStatusSummary.map((item) => item.count)),
    [bookingStatusSummary]
  );

  const getAdminIdentity = () => {
    const firstName = user?.firstName?.trim() || "";
    const lastName = user?.lastName?.trim() || "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || user?.name || user?.email || "Current admin";
  };

  const formatDateTime = (value) => {
    if (!value) return "Not set";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
  };

  const closeBookingDetails = () => {
    setSelectedBookingId("");
    setDecisionNote("");
    setDecisionError("");
  };

  const handleStatusUpdate = async (booking, status, options = {}) => {
    const normalizedReason = (options.note ?? decisionNote).trim();
    if (status === "REJECTED" && !normalizedReason && !options.allowEmptyRejectReason) {
      setDecisionError("Please provide a rejection reason so the requester understands the decision.");
      return;
    }

    setDecisionError("");
    setSavingStatus(status);
    setSavingBookingId(booking.id);

    try {
      if (booking.isResource) {
        await updateAdminResourceBookingStatus(booking.id, status);
      } else {
        await updateAdminBookingStatus(booking.id, status);
      }

      const auditEntry = {
        status,
        actor: getAdminIdentity(),
        at: new Date().toISOString(),
        note: normalizedReason || "No additional note",
      };

      setActionLogByBooking((current) => ({
        ...current,
        [booking.id]: auditEntry,
      }));

      setDecisionNote("");
      await loadBookings();
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setSavingStatus("");
      setSavingBookingId("");
    }
  };

  const handleQuickAction = async (event, booking, status) => {
    event.preventDefault();
    event.stopPropagation();

    if (status === "REJECTED") {
      await handleStatusUpdate(booking, status, {
        allowEmptyRejectReason: true,
        note: "Rejected via quick action",
      });
      return;
    }

    await handleStatusUpdate(booking, status);
  };

  const formatLabel = (value) => (value ? value : "Not set");

  const getBookingKindLabel = (booking) => (booking?.isResource ? "Resource booking" : "Facility booking");

  const getStatusTone = (status) => {
    const normalized = (status || "").toUpperCase();
    if (normalized === "APPROVED") return "approved";
    if (normalized === "PENDING") return "pending";
    if (normalized === "REJECTED") return "rejected";
    if (normalized === "CANCELLED") return "cancelled";
    return "default";
  };

  const renderActionButtons = (booking) => {
    if (!booking?.status) {
      return <span className="helper-text">No actions available</span>;
    }

    return (
      <div className="admin-booking-actions admin-booking-actions-modal">
        {booking.status === "PENDING" ? (
          <>
            <label className="admin-booking-decision-label" htmlFor="admin-decision-note">
              Admin decision note (required for reject)
            </label>
            <textarea
              id="admin-decision-note"
              className="admin-booking-decision-note"
              value={decisionNote}
              onChange={(event) => {
                setDecisionNote(event.target.value);
                if (decisionError) {
                  setDecisionError("");
                }
              }}
              placeholder="Explain why this request is rejected or add context for approval"
              rows={3}
            />

            {decisionError ? <p className="error-text admin-booking-decision-error">{decisionError}</p> : null}

            <div className="admin-booking-modal-actions-row">
              <button
                type="button"
                className="solid-btn"
                disabled={savingStatus === "APPROVED" || savingStatus === "REJECTED"}
                onClick={() => handleStatusUpdate(booking, "APPROVED")}
              >
                {savingStatus === "APPROVED" ? "Approving..." : "Approve"}
              </button>
              <button
                type="button"
                className="ghost-btn"
                disabled={savingStatus === "APPROVED" || savingStatus === "REJECTED"}
                onClick={() => handleStatusUpdate(booking, "REJECTED")}
              >
                {savingStatus === "REJECTED" ? "Rejecting..." : "Reject with reason"}
              </button>
            </div>
          </>
        ) : null}

        {booking.status === "APPROVED" ? (
          <button
            type="button"
            className="ghost-btn"
            disabled={savingStatus === "CANCELLED"}
            onClick={() => handleStatusUpdate(booking, "CANCELLED")}
          >
            {savingStatus === "CANCELLED" ? "Cancelling..." : "Cancel booking"}
          </button>
        ) : null}
      </div>
    );
  };

  const renderQuickActionButtons = (booking) => {
    if (booking.status !== "PENDING") {
      return null;
    }

    const isBusy = savingBookingId === booking.id && (savingStatus === "APPROVED" || savingStatus === "REJECTED");

    return (
      <div className="admin-booking-card-quick-actions">
        <button
          type="button"
          className="admin-booking-card-quick-btn admin-booking-card-quick-btn-approve"
          disabled={isBusy}
          onClick={(event) => handleQuickAction(event, booking, "APPROVED")}
        >
          <span className="admin-booking-card-quick-icon">✓</span>
          {savingBookingId === booking.id && savingStatus === "APPROVED" ? "Approving..." : "Approve"}
        </button>
        <button
          type="button"
          className="admin-booking-card-quick-btn admin-booking-card-quick-btn-reject"
          disabled={isBusy}
          onClick={(event) => handleQuickAction(event, booking, "REJECTED")}
        >
          <span className="admin-booking-card-quick-icon">✕</span>
          {savingBookingId === booking.id && savingStatus === "REJECTED" ? "Rejecting..." : "Reject"}
        </button>
      </div>
    );
  };

  return (
    <PortalLayout
      title="Booking Management"
      subtitle="Approve, reject, and manage all campus facility and resource booking requests."
    >
      <section className="admin-vision-layout admin-user-vision-layout">
        <aside className="admin-vision-sidebar">
          <div className="admin-vision-brand">
            <img src="/nnic-logo-icon.png" alt="NNIC logo" className="admin-vision-brand-logo" />
          </div>
          <nav className="admin-vision-nav" aria-label="Admin quick menu">
            <NavLink to="/admin/profile" className="admin-vision-link">Dashboard</NavLink>
            <NavLink to="/admin/users" className="admin-vision-link">User Management</NavLink>
            <NavLink to="/admin/facilities" className="admin-vision-link">Resource Management</NavLink>
            <NavLink to="/admin/tickets" className="admin-vision-link">Ticket Management</NavLink>
            <NavLink to="/admin/bookings" className="admin-vision-link">Booking Management</NavLink>
            <NavLink to="/admin/notifications" className="admin-vision-link">Notifications</NavLink>
          </nav>
        </aside>

        <div className="admin-vision-main admin-user-vision-main">
          <section className="admin-user-panel">
            <div className="admin-section-head">
              <div>
                <p className="student-modern-section-label">All Bookings</p>
                <h3 className="admin-section-title">Central Booking Hub</h3>
              </div>
            </div>
            
            {error && <p className="error-text">{error}</p>}
            
            {loading ? (
              <p className="helper-text">Loading bookings...</p>
            ) : (
              <>
                <div className="student-booking-stat-grid admin-booking-stat-grid">
                  <article className="student-booking-stat-card student-booking-stat-card-total">
                    <p>Total Requests</p>
                    <strong>{bookings.length}</strong>
                    <span>Facility + resource bookings</span>
                  </article>
                  <article className="student-booking-stat-card student-booking-stat-card-approved">
                    <p>Urgent Requests</p>
                    <strong>{bookings.filter((booking) => (booking.priority || "NORMAL") === "URGENT").length}</strong>
                    <span>Top of queue</span>
                  </article>
                  <article className="student-booking-stat-card student-booking-stat-card-rejected">
                    <p>Review Needed</p>
                    <strong>{bookings.filter((booking) => booking.reviewRequired).length}</strong>
                    <span>Decision support</span>
                  </article>
                </div>

                <section className="admin-booking-chart-card" aria-label="Request status bar chart">
                  <div className="admin-booking-chart-head">
                    <div>
                      <p className="student-modern-section-label">Status Analytics</p>
                      <h4>Approved vs Rejected vs Pending</h4>
                    </div>
                    <div className="admin-booking-filter-strip" aria-label="Date range selector">
                      {dateRangeOptions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          className={`admin-booking-filter-chip${dateRangeFilter === option.key ? " admin-booking-filter-chip-active" : ""}`}
                          onClick={() => setDateRangeFilter(option.key)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="admin-booking-status-chart" role="img" aria-label="Bar chart of approved, rejected, and pending booking requests">
                    {bookingStatusSummary.map((item) => {
                      const barHeight = Math.max((item.count / maxBookingStatusCount) * 100, 10);
                      const isStatusActive = statusFilter === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          className={`admin-booking-status-column${isStatusActive ? " admin-booking-status-column-active" : ""}`}
                          onClick={() => setStatusFilter((current) => (current === item.key ? "ALL" : item.key))}
                        >
                          <strong className="admin-booking-status-value">{item.count}</strong>
                          <div
                            className={`admin-booking-status-bar admin-booking-status-bar-${item.tone}`}
                            style={{ height: `${barHeight}%` }}
                            aria-label={`${item.label}: ${item.count}`}
                          />
                          <span className="admin-booking-status-label">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="admin-booking-chart-footer">
                    <span className="helper-text">
                      Active status filter: {statusFilter === "ALL" ? "None" : statusFilter}
                    </span>
                    {statusFilter !== "ALL" ? (
                      <button type="button" className="admin-booking-filter-reset" onClick={() => setStatusFilter("ALL")}>
                        Clear status filter
                      </button>
                    ) : null}
                  </div>
                </section>

                <div className="admin-booking-master-detail admin-booking-master-detail-single">
                  <section className="admin-booking-list-panel">
                    <div className="admin-booking-list-header">
                      <div>
                        <p className="student-modern-section-label">Booking Queue</p>
                        <h4>Latest requests first</h4>
                        <p className="helper-text admin-booking-list-context">
                          Showing {filteredBookings.length} of {timeFilteredBookings.length} requests for {dateRangeOptions.find((option) => option.key === dateRangeFilter)?.label}.
                        </p>
                      </div>
                    </div>

                    <div className="admin-booking-cards">
                      {paginatedBookings.length ? paginatedBookings.map((booking) => {
                        const statusTone = getStatusTone(booking.status);
                        const isSelected = booking.id === selectedBooking?.id;
                        return (
                          <div
                            key={booking.id}
                            role="button"
                            tabIndex={0}
                            className={`admin-booking-card${isSelected ? " admin-booking-card-active" : ""}`}
                            onClick={() => {
                              setSelectedBookingId(booking.id);
                              setDecisionNote("");
                              setDecisionError("");
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setSelectedBookingId(booking.id);
                                setDecisionNote("");
                                setDecisionError("");
                              }
                            }}
                          >
                            <div className="admin-booking-card-top">
                              <div>
                                <span className={`student-booking-status-badge student-booking-status-${statusTone}`}>
                                  {booking.status}
                                </span>
                                <h5>{getBookingKindLabel(booking)}</h5>
                                <p>{booking.requestedByName}</p>
                              </div>
                              <div className="admin-booking-card-time">
                                <strong>{booking.bookingDate}</strong>
                                <span>{booking.startTime} - {booking.endTime}</span>
                              </div>
                            </div>
                            <div className="admin-booking-card-body">
                              <span className="admin-booking-card-room">{booking.isResource ? booking.roomNumber : `${booking.buildingName} · Floor ${booking.floorNumber} · ${booking.roomNumber}`}</span>
                              <span className="admin-booking-card-meta">{booking.isResource ? booking.resourceCategory || "Resource" : `Purpose: ${booking.purpose || "Study"}`}</span>
                              {!booking.isResource && booking.selectedSeats && booking.selectedSeats.length > 0 ? (
                                <span className="admin-booking-card-meta">Seats: {booking.selectedSeats.join(", ")}</span>
                              ) : null}
                            </div>
                            {renderQuickActionButtons(booking)}
                          </div>
                        );
                      }) : (
                        <div className="empty-state">
                          <div className="empty-icon">📋</div>
                          <p className="helper-text">No bookings match the current filters.</p>
                        </div>
                      )}
                    </div>

                    <div className="admin-booking-list-footer">
                      <p className="helper-text">
                        Showing {pageStart} to {pageEnd} of {filteredBookings.length} requests
                      </p>
                      {filteredBookings.length ? (
                        <div className="admin-booking-pagination" aria-label="Booking queue pagination">
                          <button
                            type="button"
                            className="admin-booking-page-btn"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                          >
                            ‹
                          </button>
                          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                            <button
                              key={page}
                              type="button"
                              className={`admin-booking-page-btn${page === currentPage ? " admin-booking-page-btn-active" : ""}`}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </button>
                          ))}
                          <button
                            type="button"
                            className="admin-booking-page-btn"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                          >
                            ›
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </section>
                </div>

                {selectedBooking ? (
                  <div
                    className="admin-booking-modal-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Booking request details"
                    onClick={(event) => {
                      if (event.target === event.currentTarget) {
                        closeBookingDetails();
                      }
                    }}
                  >
                    <aside className="admin-booking-detail-card admin-booking-detail-view admin-booking-detail-modal">
                      <div className="admin-booking-detail-head admin-booking-detail-head-modal">
                        <div>
                          <p className="student-modern-section-label">Request Details</p>
                          <h4>{getBookingKindLabel(selectedBooking)}</h4>
                        </div>
                        <div className="admin-booking-modal-head-actions">
                          <span className={`student-booking-status-badge student-booking-status-${getStatusTone(selectedBooking.status)}`}>
                            {selectedBooking.status}
                          </span>
                          <button type="button" className="admin-booking-modal-close" onClick={closeBookingDetails}>
                            Close
                          </button>
                        </div>
                      </div>

                      <div className="admin-booking-detail-grid">
                        <div className="admin-booking-detail-item">
                          <span className="detail-label">Requester</span>
                          <strong>{formatLabel(selectedBooking.requestedByName)}</strong>
                          <small>User ID: {formatLabel(selectedBooking.userId)}</small>
                        </div>
                        <div className="admin-booking-detail-item">
                          <span className="detail-label">Where</span>
                          <strong>{selectedBooking.isResource ? selectedBooking.resourceCategory : selectedBooking.buildingName}</strong>
                          <small>{selectedBooking.isResource ? selectedBooking.resourceName : `Floor ${selectedBooking.floorNumber} · ${selectedBooking.roomNumber}`}</small>
                        </div>
                        <div className="admin-booking-detail-item">
                          <span className="detail-label">When</span>
                          <strong>{selectedBooking.bookingDate}</strong>
                          <small>{selectedBooking.startTime} - {selectedBooking.endTime}</small>
                        </div>
                        <div className="admin-booking-detail-item">
                          <span className="detail-label">Review / Decision</span>
                          <strong>{selectedBooking.reviewRequired ? "Review required" : "Auto-approved"}</strong>
                          <small>{selectedBooking.decisionNote || "No note provided"}</small>
                        </div>
                      </div>

                      {!selectedBooking.isResource ? (
                        <div className="admin-booking-detail-section">
                          <h5>Facility Details</h5>
                          <div className="admin-booking-pill-row">
                            <span className="admin-booking-pill">Purpose: {selectedBooking.purpose || "Study"}</span>
                            <span className="admin-booking-pill">Priority: {selectedBooking.priority || "NORMAL"}</span>
                            <span className="admin-booking-pill">Seats: {selectedBooking.selectedSeats?.length ? selectedBooking.selectedSeats.join(", ") : "Whole room"}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="admin-booking-detail-section">
                          <h5>Resource Details</h5>
                          <div className="admin-booking-pill-row">
                            <span className="admin-booking-pill">Category: {selectedBooking.resourceCategory}</span>
                            <span className="admin-booking-pill">Resource: {selectedBooking.roomNumber}</span>
                          </div>
                        </div>
                      )}

                      <div className="admin-booking-detail-section">
                        <h5>Audit Info</h5>
                        <div className="admin-booking-pill-row">
                          <span className="admin-booking-pill">Created: {selectedBooking.createdAt || "N/A"}</span>
                          <span className="admin-booking-pill">Booking ID: {selectedBooking.id}</span>
                        </div>
                      </div>

                      <div className="admin-booking-detail-section">
                        <h5>Latest Admin Action</h5>
                        {selectedBookingActionLog ? (
                          <div className="admin-booking-action-log">
                            <p><strong>Status:</strong> {selectedBookingActionLog.status}</p>
                            <p><strong>By:</strong> {selectedBookingActionLog.actor}</p>
                            <p><strong>At:</strong> {formatDateTime(selectedBookingActionLog.at)}</p>
                            <p><strong>Note:</strong> {selectedBookingActionLog.note}</p>
                          </div>
                        ) : (
                          <p className="helper-text">No admin action recorded in this session yet.</p>
                        )}
                      </div>

                      {renderActionButtons(selectedBooking)}
                    </aside>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>
      </section>
    </PortalLayout>
  );
}

export default AdminBookingManagement;
