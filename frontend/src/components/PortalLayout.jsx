import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
  isStudentLikeRole,
  normalizeRole,
  profilePathByRole,
  roleLabel,
} from "../utils/role";

function PortalLayout({ title, subtitle, children, loading }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const role = normalizeRole(user?.role);

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="page-wrap">
      <header className="top-bar">
        <Link className="brand" to="/">
          BookFlow Library
        </Link>

        {isAuthenticated ? (
          <div className="top-actions">
            <Link className="top-link" to={profilePathByRole(role)}>
              {roleLabel(role)} Profile
            </Link>
            {isStudentLikeRole(role) ? (
              <Link className="top-link" to="/notifications">
                Notifications
              </Link>
            ) : null}
            {role === "student" ? (
              <Link className="top-link" to="/student/dashboard">
                Student Dashboard
              </Link>
            ) : null}
            {role === "student" ? (
              <Link className="top-link" to="/student/support">
                Student Support
              </Link>
            ) : null}
            {role === "admin" ? (
              <Link className="top-link" to="/admin/users">
                User Management
              </Link>
            ) : null}
            <button className="ghost-btn" type="button" onClick={onLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="top-actions">
            <Link className="top-link" to="/login">
              Login
            </Link>
            <Link className="solid-btn" to="/register">
              Register
            </Link>
          </div>
        )}
      </header>

      <main className="content-grid">
        <section className="hero-card">
          <p className="hero-eyebrow">Library Management Platform</p>
          <h1>{title}</h1>
          {subtitle ? <p className="hero-subtitle">{subtitle}</p> : null}
        </section>

        <section className="card">{loading ? <p>Loading data...</p> : children}</section>
      </main>
    </div>
  );
}

export default PortalLayout;
