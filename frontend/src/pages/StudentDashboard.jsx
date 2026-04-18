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

const profileHighlights = ["Semester 2", "IT - Year 3", "Colombo Center"];

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
      title="Welcome back, Jane."
      subtitle="Continue where you left off. Review alerts, jump into Student Support, and keep your academic tasks moving."
    >
      <section className="student-home-shell">
        <article className="metric-card student-home-panel student-home-panel-profile">
          <div className="student-home-panel-head">
            <span className="student-home-icon student-home-icon-profile">PR</span>
            <h3>Profile Snapshot</h3>
          </div>
          <div className="student-home-profile-avatar-row">
            <span className="student-home-profile-avatar">JS</span>
            <div>
              <p><strong>Jane Student</strong></p>
              <p className="helper-text">jane.student@bookflow.edu</p>
            </div>
          </div>
          <div className="student-home-profile-tags">
            {profileHighlights.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <p><strong>Name:</strong> Jane Student</p>
          <p><strong>Program:</strong> Information Technology</p>
          <p><strong>Campus Year:</strong> 3rd Year</p>
          <p><strong>Center:</strong> Colombo Center</p>
          <Link className="top-link" to="/student/profile">View full profile</Link>
        </article>

        <article className="metric-card student-home-panel student-home-panel-notifications">
          <div className="student-home-panel-head">
            <span className="student-home-icon student-home-icon-notifications">NT</span>
            <h3>Notifications Preview</h3>
          </div>
          <div className="student-home-avatars" aria-hidden="true">
            <span>AL</span>
            <span>SU</span>
            <span>LB</span>
          </div>
          <ul className="list-clean student-home-list">
            {notificationPreview.map((item) => (
              <li key={item}>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link className="top-link" to="/notifications">Open notifications</Link>
        </article>

        <article className="metric-card student-home-panel student-home-panel-support">
          <div className="student-home-panel-head">
            <span className="student-home-icon student-home-icon-support">SP</span>
            <h3>Student Support</h3>
          </div>
          <p className="helper-text">
            Need help with borrowing, account access, or technical issues? Open support and raise a request
            quickly.
          </p>
          <div className="student-home-actions-inline">
            <Link className="solid-btn student-home-button" to="/student/support">Open Support</Link>
            <Link className="ghost-btn student-home-button" to="/student/support/raise">Raise Ticket</Link>
          </div>
        </article>

        <article className="card student-home-quick-actions student-home-panel">
          <h3>Quick Actions</h3>
          <div className="student-home-quick-grid">
            {quickActions.map((action) => (
              <Link key={action.label} className="solid-btn student-home-button" to={action.to}>
                {action.label}
              </Link>
            ))}
          </div>
        </article>

        <article className="metric-card student-home-panel student-home-panel-activity">
          <h3>Recent Activity</h3>
          <ul className="list-clean student-home-list">
            {recentActivity.map((item) => (
              <li key={item}>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="metric-card student-home-panel student-home-panel-announcements">
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
