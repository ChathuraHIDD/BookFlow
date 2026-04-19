import { Link } from "react-router-dom";

import PortalLayout from "../components/PortalLayout";
import avatarAl from "../assets/avatar-al.svg";
import avatarJs from "../assets/avatar-js.svg";
import avatarLb from "../assets/avatar-lb.svg";
import avatarSu from "../assets/avatar-su.svg";
import supportIllustration from "../assets/support-illustration.svg";

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
    icon: "👤",
    label: "View Profile",
    to: "/student/profile",
  },
  {
    icon: "🔔",
    label: "Open Notifications",
    to: "/notifications",
  },
  {
    icon: "🛟",
    label: "Go to Support",
    to: "/student/support",
  },
  {
    icon: "➕",
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
            <span className="student-home-icon student-home-icon-profile" aria-hidden="true">👤</span>
            <h3>Profile Snapshot</h3>
          </div>
          <div className="student-home-profile-avatar-row">
            <img className="student-home-profile-avatar" src={avatarJs} alt="Jane Student" />
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
            <span className="student-home-icon student-home-icon-notifications" aria-hidden="true">🔔</span>
            <h3>Notifications Preview</h3>
          </div>
          <div className="student-home-avatars" aria-hidden="true">
            <img src={avatarAl} alt="Alert author AL" />
            <img src={avatarSu} alt="Alert author SU" />
            <img src={avatarLb} alt="Alert author LB" />
          </div>
          <ul className="list-clean student-home-list student-home-notification-list">
            {notificationPreview.map((item, index) => (
              <li
                key={item}
                className="student-home-notification-item"
                style={{ "--n-delay": `${index * 0.14}s` }}
              >
                <span className="student-home-notification-dot" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link className="top-link" to="/notifications">Open notifications</Link>
        </article>

        <article className="metric-card student-home-panel student-home-panel-support">
          <div className="student-home-panel-head">
            <span className="student-home-icon student-home-icon-support" aria-hidden="true">🛟</span>
            <h3>Student Support</h3>
          </div>
          <div className="student-home-support-media" aria-hidden="true">
            <img src={supportIllustration} alt="" />
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
          <h3><span className="student-home-title-icon" aria-hidden="true">⚡</span>Quick Actions</h3>
          <div className="student-home-quick-grid">
            {quickActions.map((action) => (
              <Link key={action.label} className="solid-btn student-home-button" to={action.to}>
                <span className="student-home-action-icon" aria-hidden="true">{action.icon}</span>
                {action.label}
              </Link>
            ))}
          </div>
        </article>

        <article className="metric-card student-home-panel student-home-panel-activity">
          <h3><span className="student-home-title-icon" aria-hidden="true">🕘</span>Recent Activity</h3>
          <ul className="list-clean student-home-list">
            {recentActivity.map((item) => (
              <li key={item}>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="metric-card student-home-panel student-home-panel-announcements">
          <h3><span className="student-home-title-icon" aria-hidden="true">📢</span>Announcements</h3>
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
