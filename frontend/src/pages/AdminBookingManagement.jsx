import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import PortalLayout from "../components/PortalLayout";
import { fetchAdminFacilityBookings, updateAdminBookingStatus } from "../services/facilities";
import { fetchAdminResourceBookings, updateAdminResourceBookingStatus } from "../services/resources";
import { readApiError } from "../services/api";

function AdminBookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      
      // Sort pending first, then by date descending
      combined.sort((a, b) => {
        if (a.status === "PENDING" && b.status !== "PENDING") return -1;
        if (a.status !== "PENDING" && b.status === "PENDING") return 1;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });

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
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Requester</th>
                      <th>Details</th>
                      <th>Date & Time</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>
                          <span className={`student-booking-status-badge student-booking-status-default`}>
                            {booking.isResource ? "Generic Resource" : "Classroom"}
                          </span>
                        </td>
                        <td>{booking.requestedByName}</td>
                        <td>
                          <strong>{booking.buildingName}</strong>
                          <br />
                          {booking.isResource ? booking.roomNumber : `Floor ${booking.floorNumber} - ${booking.roomNumber}`}
                        </td>
                        <td>
                          {booking.bookingDate}
                          <br />
                          <small>{booking.startTime} - {booking.endTime}</small>
                        </td>
                        <td>
                          <span className={`student-booking-status-badge student-booking-status-${booking.status.toLowerCase()}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="admin-facilities-actions">
                          {booking.status === "PENDING" && (
                            <>
                              <button className="solid-btn" onClick={() => handleStatusUpdate(booking.id, "APPROVED", booking.isResource)}>Approve</button>
                              <button className="ghost-btn" onClick={() => handleStatusUpdate(booking.id, "REJECTED", booking.isResource)}>Reject</button>
                            </>
                          )}
                          {booking.status === "APPROVED" && (
                            <button className="ghost-btn" onClick={() => handleStatusUpdate(booking.id, "CANCELLED", booking.isResource)}>Cancel</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </section>
    </PortalLayout>
  );
}

export default AdminBookingManagement;
