import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
  isStudentLikeRole,
  normalizeRole,
  profilePathByRole,
  roleLabel,
} from "../utils/role";

function PortalLayout({
  title,
  subtitle,
  children,
  loading,
  pageClassName = "",
  heroClassName = "",
  contentCardClassName = "",
  headerContent = null,
}) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const role = normalizeRole(user?.role);
  const roleProfileLabel = role === "technician" ? "Ticket Management" : `${roleLabel(role)} Profile`;

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  const topLinkClassName = ({ isActive }) => `top-link${isActive ? " top-link-active" : ""}`;

  return (
    <div className={`page-wrap app-shell-page ${pageClassName}`.trim()}>
      <header className="top-bar">
        <Link className="brand" to="/">
          <img src="/nnic-logo-icon.png" alt="NNIC logo" className="brand-logo" />
        </Link>

        {headerContent ? (
          headerContent
        ) : isAuthenticated ? (
          <div className="top-actions">
            {role === "student" ? (
              <NavLink className={topLinkClassName} to="/student/dashboard" end>
                Student Dashboard
              </NavLink>
            ) : null}
            <NavLink className={topLinkClassName} to={profilePathByRole(role)} end>
              {roleProfileLabel}
            </NavLink>
            {isStudentLikeRole(role) || role === "technician" ? (
              <NavLink className={topLinkClassName} to="/notifications" end>
                Notifications
              </NavLink>
            ) : null}
            {role === "student" ? (
              <NavLink className={topLinkClassName} to="/student/support">
                Student Support
              </NavLink>
            ) : null}
            {role === "admin" ? (
              <NavLink className={topLinkClassName} to="/admin/users" end>
                User Management
              </NavLink>
            ) : null}
            {role === "admin" ? (
              <NavLink className={topLinkClassName} to="/admin/facilities" end>
                Facilities
              </NavLink>
            ) : null}
            {role === "admin" ? (
              <NavLink className={topLinkClassName} to="/admin/facilities/maintenance" end>
                Maintenance
              </NavLink>
            ) : null}
            {role === "admin" ? (
              <NavLink className={topLinkClassName} to="/admin/tickets" end>
                Ticket Management
              </NavLink>
            ) : null}
            {role === "admin" ? (
              <NavLink className={topLinkClassName} to="/admin/bookings" end>
                Booking Management
              </NavLink>
            ) : null}
            {role === "admin" ? (
              <NavLink className={topLinkClassName} to="/admin/notifications" end>
                Notifications
              </NavLink>
            ) : null}
            <button className="ghost-btn" type="button" onClick={onLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="top-actions">
            <NavLink className={topLinkClassName} to="/login" end>
              Login
            </NavLink>
            <Link className="solid-btn" to="/register">
              Register
            </Link>
          </div>
        )}
      </header>

      <main className="content-grid">
        <section className={`hero-card app-hero-card ${heroClassName}`.trim()}>
          <h1>{title}</h1>
          {subtitle ? <p className="hero-subtitle">{subtitle}</p> : null}
        </section>

        <section className={`card app-surface-card ${contentCardClassName}`.trim()}>
          {loading ? <p>Loading data...</p> : children}
        </section>
      </main>
    </div>
  );
}

export default PortalLayout;
