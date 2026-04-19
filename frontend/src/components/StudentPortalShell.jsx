import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PortalLayout from "./PortalLayout";
import { useAuth } from "../context/useAuth";

const sidebarItems = [
  { key: "home", icon: "H", label: "Home", to: "/student/dashboard" },
  { key: "books", icon: "B", label: "My Books", to: "/student/profile" },
  { key: "facilities", icon: "F", label: "Facilities", to: "/student/facilities" },
  { key: "notifications", icon: "N", label: "Notifications", to: "/notifications" },
  { key: "support", icon: "S", label: "Support", to: "/student/support" },
  { key: "ticket", icon: "+", label: "Raise Ticket", to: "/student/support/raise" },
];

function StudentPortalShell({ activeKey = "home", children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const menuRef = useRef(null);
  const notificationsRef = useRef(null);
  const fullName = user?.fullName?.trim() || "Jane Student";
  const firstName = fullName.split(/\s+/)[0] || "Student";
  const initials = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "U";

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }

      if (!notificationsRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    const onEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const onLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  const onOpenProfile = () => {
    setMenuOpen(false);
    navigate("/student/profile");
  };

  const recentNotifications = [
    "Book BK-1037 is due in 2 days.",
    "Your reservation for Software Quality Assurance is ready.",
    "Library orientation session starts tomorrow at 10:00 AM.",
  ];

  return (
    <PortalLayout
      pageClassName="student-dashboard-page"
      heroClassName="student-dashboard-hero-hidden"
      contentCardClassName="student-dashboard-surface student-modern-dashboard-surface"
      headerContent={(
        <div className="student-modern-header-right">
          <div className="student-modern-search">Search</div>
          <div
            ref={notificationsRef}
            className={`student-modern-notification-menu${notificationsOpen ? " student-modern-notification-menu-open" : ""}`}
            onMouseEnter={() => setNotificationsOpen(true)}
            onMouseLeave={() => setNotificationsOpen(false)}
          >
            <button
              className="student-modern-header-icon student-modern-notification-trigger"
              type="button"
              aria-label="Notifications"
              aria-haspopup="menu"
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen((prev) => !prev)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M12 3a5 5 0 0 0-5 5v2.43c0 .85-.34 1.67-.94 2.27L4.3 14.46A1 1 0 0 0 5 16h14a1 1 0 0 0 .7-1.71l-1.76-1.76a3.2 3.2 0 0 1-.94-2.27V8a5 5 0 0 0-5-5Z" />
                <path d="M9.5 18a2.5 2.5 0 0 0 5 0" />
              </svg>
            </button>

            <div className="student-modern-notification-dropdown" role="menu" aria-label="Recent notifications">
              <div className="student-modern-notification-head">
                <strong>Notifications</strong>
                <span>Latest updates</span>
              </div>

              <ul className="student-modern-notification-list">
                {recentNotifications.map((note) => (
                  <li key={note} className="student-modern-notification-item">
                    {note}
                  </li>
                ))}
              </ul>

              <button
                className="student-modern-notification-link"
                type="button"
                onClick={() => {
                  setNotificationsOpen(false);
                  navigate("/notifications");
                }}
              >
                View all notifications
              </button>
            </div>
          </div>
          <div className="student-modern-profile-chip">
            <span className="student-modern-profile-label">Hello</span>
            <strong>{firstName}</strong>
          </div>
          <div
            ref={menuRef}
            className={`student-modern-avatar-menu${menuOpen ? " student-modern-avatar-menu-open" : ""}`}
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button
              className="student-modern-header-avatar student-modern-avatar-trigger"
              type="button"
              aria-label={fullName}
              title={fullName}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {initials}
            </button>
            <div className="student-modern-avatar-dropdown" role="menu" aria-label="Profile menu">
              <button
                className="student-modern-avatar-action"
                type="button"
                onClick={onOpenProfile}
              >
                Profile
              </button>
              <button
                className="student-modern-avatar-action student-modern-avatar-logout"
                type="button"
                onClick={onLogout}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
      title="Student Dashboard"
      subtitle=""
    >
      <section className="student-modern-dashboard">
        <aside className="student-modern-sidebar">
          <div className="student-modern-brand-mark">
            <span className="student-modern-brand-dot student-modern-brand-dot-pink" />
            <span className="student-modern-brand-dot student-modern-brand-dot-blue" />
            <span className="student-modern-brand-text">Student Hub</span>
          </div>

          <nav className="student-modern-sidebar-nav" aria-label="Student navigation">
            {sidebarItems.map((item) => (
              <Link
                key={item.key}
                className={`student-modern-sidebar-link${item.key === activeKey ? " student-modern-sidebar-link-active" : ""}`}
                to={item.to}
              >
                <span className="student-modern-sidebar-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="student-modern-plan-card">
            <p>Your plan</p>
            <strong>Student Plus</strong>
          </div>
        </aside>

        <main className="student-modern-main">
          {children}
        </main>
      </section>
    </PortalLayout>
  );
}

export default StudentPortalShell;
