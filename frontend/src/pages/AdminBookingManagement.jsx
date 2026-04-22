import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

import PortalLayout from "../components/PortalLayout";
import { fetchAdminFacilityBookings, updateAdminBookingStatus } from "../services/facilities";
import { fetchAdminResourceBookings, updateAdminResourceBookingStatus } from "../services/resources";
import { readApiError } from "../services/api";

function AdminBookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState("");

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
      setSelectedBookingId((current) => current || combined[0]?.id || "");
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.id === selectedBookingId) || bookings[0] || null,
    [bookings, selectedBookingId]
  );

  const handleStatusUpdate = async (bookingId, status, isResource) => {
    try {
      if (isResource) {
        await updateAdminResourceBookingStatus(bookingId, status);
      } else {
        await updateAdminBookingStatus(bookingId, status);
      }
      await loadBookings();
    } catch (err) {
      setError(readApiError(err));
    }
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

  const renderActionButtons = (booking, compact = false) => (
    <div className={`admin-booking-actions${compact ? " admin-booking-actions-compact" : ""}`}>
      {booking.status === "PENDING" && (
        <>
          <button type="button" className="solid-btn" onClick={() => handleStatusUpdate(booking.id, "APPROVED", booking.isResource)}>Approve</button>
          <button type="button" className="ghost-btn" onClick={() => handleStatusUpdate(booking.id, "REJECTED", booking.isResource)}>Reject</button>
        </>
      )}
      {booking.status === "APPROVED" && (
        <button type="button" className="ghost-btn" onClick={() => handleStatusUpdate(booking.id, "CANCELLED", booking.isResource)}>Cancel</button>
      )}
      {!booking.status && (
        <span className="helper-text">No actions available</span>
      )}
    </div>
  );

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

                <div className="admin-booking-master-detail">
                  <section className="admin-booking-list-panel">
                    <div className="admin-booking-list-header">
                      <div>
                        <p className="student-modern-section-label">Booking Queue</p>
                        <h4>Latest requests first</h4>
                      </div>
                    </div>

                    <div className="admin-booking-cards">
                      {bookings.length ? bookings.map((booking) => {
                        const statusTone = getStatusTone(booking.status);
                        const isSelected = booking.id === selectedBooking?.id;
                        return (
                          <button
                            key={booking.id}
                            type="button"
                            className={`admin-booking-card${isSelected ? " admin-booking-card-active" : ""}`}
                            onClick={() => setSelectedBookingId(booking.id)}
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
                          </button>
                        );
                      }) : (
                        <div className="empty-state">
                          <div className="empty-icon">📋</div>
                          <p className="helper-text">No bookings available.</p>
                        </div>
                      )}
                    </div>
                  </section>

                  <aside className="admin-booking-detail-card admin-booking-detail-view">
                    {selectedBooking ? (
                      <>
                        <div className="admin-booking-detail-head">
                          <div>
                            <p className="student-modern-section-label">Selected Booking</p>
                            <h4>{getBookingKindLabel(selectedBooking)}</h4>
                          </div>
                          <span className={`student-booking-status-badge student-booking-status-${getStatusTone(selectedBooking.status)}`}>
                            {selectedBooking.status}
                          </span>
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

                        {renderActionButtons(selectedBooking)}
                      </>
                    ) : (
                      <p className="helper-text">Select a booking to inspect its details.</p>
                    )}
                  </aside>
                </div>
              </>
            )}
          </section>
        </div>
      </section>
    </PortalLayout>
  );
}

export default AdminBookingManagement;
