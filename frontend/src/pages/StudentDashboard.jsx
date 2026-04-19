import { Link } from "react-router-dom";

import PortalLayout from "../components/PortalLayout";
import avatarJs from "../assets/avatar-js.svg";
import heroGraphic from "../assets/hero.png";
import supportIllustration from "../assets/support-illustration.svg";

const sidebarItems = [
  { icon: "⌂", label: "Home", active: true, to: "/student/dashboard" },
  { icon: "◫", label: "My Books", to: "/student/profile" },
  { icon: "✦", label: "Notifications", to: "/notifications" },
  { icon: "⚙", label: "Support", to: "/student/support" },
  { icon: "+", label: "Raise Ticket", to: "/student/support/raise" },
];

const statusCards = [
  {
    title: "Books Due Soon",
    subtitle: "Stay ahead of your return dates",
    yes: "02",
    no: "01",
    na: "00",
  },
  {
    title: "Notifications",
    subtitle: "Unread alerts in your inbox",
    yes: "03",
    no: "01",
    na: "00",
  },
  {
    title: "Open Support",
    subtitle: "Requests currently being handled",
    yes: "01",
    no: "00",
    na: "02",
  },
];

const notifications = [
  "Book BK-1037 is due in 2 days.",
  "Your reservation for Software Quality Assurance is ready.",
  "Library orientation session starts tomorrow at 10:00 AM.",
];

const supportItems = [
  "Open a ticket for account, borrowing, or technical issues.",
  "Check replies from the library support team.",
];

const recentActivity = [
  "You submitted a support request about login access.",
  "You borrowed Digital Library Architecture.",
  "A technician replied to your previous support request.",
];

function StudentDashboard() {
  return (
    <PortalLayout
      pageClassName="student-dashboard-page"
      heroClassName="student-dashboard-hero-hidden"
      contentCardClassName="student-dashboard-surface student-modern-dashboard-surface"
      headerContent={(
        <div className="student-modern-header-right">
          <div className="student-modern-search">Search</div>
          <span className="student-modern-header-icon" aria-hidden="true">🔔</span>
          <div className="student-modern-profile-chip">
            <span className="student-modern-profile-label">Hello</span>
            <strong>Jane Student</strong>
          </div>
          <img className="student-modern-header-avatar" src={avatarJs} alt="Jane Student" />
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
                key={item.label}
                className={`student-modern-sidebar-link${item.active ? " student-modern-sidebar-link-active" : ""}`}
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
          <section className="student-modern-hero-card">
            <div className="student-modern-hero-copy">
              <p className="student-modern-section-label">Dashboard</p>
              <h2>Welcome back, <span>Jane</span></h2>
              <p>
                Check due books, review notifications, and move quickly to support whenever you need help.
              </p>
              <div className="student-modern-hero-actions">
                <Link className="solid-btn" to="/notifications">Open Notifications</Link>
                <Link className="ghost-btn" to="/student/support">Go to Support</Link>
              </div>
            </div>

            <div className="student-modern-hero-visual" aria-hidden="true">
              <img src={heroGraphic} alt="" />
            </div>
          </section>

          <section className="student-modern-status-grid">
            {statusCards.map((card) => (
              <article key={card.title} className="student-modern-status-card">
                <p className="student-modern-status-kicker">Student</p>
                <h3>{card.title}</h3>
                <p className="helper-text">{card.subtitle}</p>
                <div className="student-modern-status-metrics">
                  <div>
                    <span>Yes</span>
                    <strong>{card.yes}</strong>
                  </div>
                  <div>
                    <span>No</span>
                    <strong>{card.no}</strong>
                  </div>
                  <div>
                    <span>NA</span>
                    <strong>{card.na}</strong>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="student-modern-workspace-grid">
            <article className="student-modern-workspace-card">
              <div className="student-modern-card-head">
                <div>
                  <p className="student-modern-section-label">Workspace</p>
                  <h3>Student Workspace</h3>
                </div>
                <Link className="student-modern-inline-link" to="/student/profile">See all</Link>
              </div>

              <div className="student-modern-workspace-body">
                <div className="student-modern-feature-card student-modern-feature-card-primary">
                  <h4>Profile Snapshot</h4>
                  <p>Jane Student</p>
                  <span>Information Technology</span>
                </div>
                <div className="student-modern-feature-card">
                  <h4>Support</h4>
                  <p>1 open request</p>
                  <span>Open support and check replies.</span>
                </div>
                <div className="student-modern-feature-card">
                  <h4>Resources</h4>
                  <p>Due books and e-resources</p>
                  <span>Keep up with borrowing and reading.</span>
                </div>
              </div>

              <div className="student-modern-illustration-panel">
                <img src={supportIllustration} alt="" />
              </div>
            </article>

            <aside className="student-modern-right-rail">
              <section className="student-modern-side-card">
                <div className="student-modern-card-head">
                  <h3>Notification</h3>
                </div>
                <ul className="list-clean student-modern-mini-list">
                  {notifications.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="student-modern-side-card">
                <div className="student-modern-card-head">
                  <h3>Support</h3>
                </div>
                <ul className="list-clean student-modern-mini-list">
                  {supportItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="student-modern-side-card">
                <div className="student-modern-card-head">
                  <h3>Recent Activity</h3>
                </div>
                <ul className="list-clean student-modern-mini-list">
                  {recentActivity.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </aside>
          </section>
        </main>
      </section>
    </PortalLayout>
  );
}

export default StudentDashboard;
