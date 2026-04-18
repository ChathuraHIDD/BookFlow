import { Link } from "react-router-dom";

import PortalLayout from "../components/PortalLayout";

const notificationPreview = [
  "Book BK-1037 is due in 2 days.",
  "Your reservation for Software Quality Assurance is ready.",
  "Library orientation session starts tomorrow at 10:00 AM.",
];

const recentActivity = [
  "You submitted a support request about login access.",
  "You borrowed Digital Library Architecture.",
  "A technician replied to your previous support request.",
];

const announcements = [
  "Quiet study zone extended hours this week.",
  "Citation workshop registration is now open.",
  "New e-book collection added for semester projects.",
];

const quickActions = [
  {
    label: "View Profile",
    to: "/student/profile",
  },
  {
    label: "Open Notifications",
    to: "/notifications",
  },
  {
    label: "Go to Support",
    to: "/student/support",
  },
  {
    label: "Raise New Ticket",
    to: "/student/support/raise",
  },
];

function StudentDashboard() {
  return (
    <PortalLayout
      title="Student Dashboard"
      subtitle="Your student home for support, updates, and quick navigation."
    >
      <section className="student-home-banner">
        <p className="student-home-banner-eyebrow">Welcome Back</p>
        <h3>Ready for your next study session?</h3>
        <p>
          Start from here to check notifications, manage support requests, and keep track of library updates.
        </p>
      </section>

      <section className="student-home-grid">
        <article className="metric-card student-home-profile">
          <h3>Profile Summary</h3>
          <p><strong>Name:</strong> Jane Student</p>
          <p><strong>Program:</strong> Information Technology</p>
          <p><strong>Campus Year:</strong> 3rd Year</p>
          <p><strong>Center:</strong> Colombo Center</p>
          <Link className="top-link" to="/student/profile">View full profile</Link>
        </article>

        <article className="metric-card">
          <h3>Notifications Preview</h3>
          <ul className="list-clean student-home-list">
            {notificationPreview.map((item) => (
              <li key={item}>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link className="top-link" to="/notifications">Open notifications</Link>
        </article>

        <article className="metric-card">
          <h3>Student Support</h3>
          <p className="helper-text">
            Need help with borrowing, account access, or technical issues? Go to Student Support and raise a
            request quickly.
          </p>
          <div className="student-home-actions-inline">
            <Link className="solid-btn" to="/student/support">Open Support</Link>
            <Link className="ghost-btn" to="/student/support/raise">Raise Ticket</Link>
          </div>
        </article>
      </section>

      <section className="card student-home-quick-actions">
        <h3>Quick Actions</h3>
        <div className="student-home-quick-grid">
          {quickActions.map((action) => (
            <Link key={action.label} className="solid-btn" to={action.to}>
              {action.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="student-home-grid student-home-bottom-grid">
        <article className="metric-card">
          <h3>Recent Activity</h3>
          <ul className="list-clean student-home-list">
            {recentActivity.map((item) => (
              <li key={item}>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="metric-card">
          <h3>Announcements</h3>
          <ul className="list-clean student-home-list">
            {announcements.map((item) => (
              <li key={item}>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </PortalLayout>
  );
}

export default StudentDashboard;
