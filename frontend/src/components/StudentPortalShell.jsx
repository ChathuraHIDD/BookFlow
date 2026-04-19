import { Link } from "react-router-dom";

import PortalLayout from "./PortalLayout";
import { useAuth } from "../context/useAuth";
import avatarJs from "../assets/avatar-js.svg";

const sidebarItems = [
  { key: "home", icon: "H", label: "Home", to: "/student/dashboard" },
  { key: "books", icon: "B", label: "My Books", to: "/student/profile" },
  { key: "facilities", icon: "F", label: "Facilities", to: "/student/facilities" },
  { key: "notifications", icon: "N", label: "Notifications", to: "/notifications" },
  { key: "support", icon: "S", label: "Support", to: "/student/support" },
  { key: "ticket", icon: "+", label: "Raise Ticket", to: "/student/support/raise" },
];

function StudentPortalShell({ activeKey = "home", children }) {
  const { user } = useAuth();
  const displayName = user?.fullName || "Jane Student";

  return (
    <PortalLayout
      pageClassName="student-dashboard-page"
      heroClassName="student-dashboard-hero-hidden"
      contentCardClassName="student-dashboard-surface student-modern-dashboard-surface"
      headerContent={(
        <div className="student-modern-header-right">
          <div className="student-modern-search">Search</div>
          <span className="student-modern-header-icon" aria-hidden="true">Bell</span>
          <div className="student-modern-profile-chip">
            <span className="student-modern-profile-label">Hello</span>
            <strong>{displayName}</strong>
          </div>
          <img className="student-modern-header-avatar" src={avatarJs} alt={displayName} />
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
