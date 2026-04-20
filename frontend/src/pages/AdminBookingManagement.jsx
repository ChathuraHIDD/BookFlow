import { NavLink } from "react-router-dom";

import PortalLayout from "../components/PortalLayout";

function AdminBookingManagement() {
  return (
    <PortalLayout
      title="Booking Management"
      subtitle="This page is intentionally empty and reserved for future booking workflow development."
    >
      <section className="admin-vision-layout admin-user-vision-layout">
        <aside className="admin-vision-sidebar">
          <div className="admin-vision-brand">NNIC Admin</div>
          <nav className="admin-vision-nav" aria-label="Admin quick menu">
            <NavLink to="/admin/profile" className="admin-vision-link">
              Dashboard
            </NavLink>
            <NavLink to="/admin/users" className="admin-vision-link">
              User Management
            </NavLink>
            <NavLink to="/admin/facilities" className="admin-vision-link">
              Resource Management
            </NavLink>
            <NavLink to="/admin/tickets" className="admin-vision-link">
              Ticket Management
            </NavLink>
            <NavLink to="/admin/bookings" className="admin-vision-link">
              Booking Management
            </NavLink>
            <NavLink to="/admin/notifications" className="admin-vision-link">
              Notifications
            </NavLink>
          </nav>
        </aside>

        <div className="admin-vision-main admin-user-vision-main">
          <section className="admin-user-panel">
            <div className="admin-section-head">
              <div>
                <p className="student-modern-section-label">Future Module</p>
                <h3 className="admin-section-title">Booking Management Workspace</h3>
              </div>
            </div>
            <p className="helper-text">
              No UI actions yet. This module is kept empty for future implementation.
            </p>
          </section>
        </div>
      </section>
    </PortalLayout>
  );
}

export default AdminBookingManagement;
