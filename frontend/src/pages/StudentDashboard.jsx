import { Link } from "react-router-dom";

import StudentPortalShell from "../components/StudentPortalShell";
import { useAuth } from "../context/useAuth";
import heroGraphic from "../assets/hero.png";

const statusCards = [
  {
    title: "Pending Profile Updates",
    value: "01",
    subtitle: "Awaiting admin review",
  },
  {
    title: "Open Support Requests",
    value: "01",
    subtitle: "Currently in progress",
  },
  {
    title: "Unread Notifications",
    value: "03",
    subtitle: "Check top-bar bell menu",
  },
];

const recentActivity = [
  "Profile update request submitted and waiting for admin approval.",
  "Support ticket #SUP-1032 updated by the operations team.",
  "New notification received for facility booking status.",
];

function StudentDashboard() {
  const { user } = useAuth();
  const fullName = user?.fullName?.trim() || "Student";
  const firstName = fullName.split(/\s+/)[0] || "Student";

  return (
    <StudentPortalShell activeKey="home">
      <section className="student-modern-hero-card">
        <div className="student-modern-hero-copy">
          <p className="student-modern-section-label">Dashboard</p>
          <h2>Welcome back, <span>{firstName}</span></h2>
          <p>
            Manage your smart-campus profile, services, and requests from one clean dashboard.
          </p>
          <div className="student-modern-hero-actions">
            <Link className="solid-btn" to="/student/profile#update-profile">Edit My Profile</Link>
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
            <h3>{card.title}</h3>
            <p className="helper-text">{card.subtitle}</p>
            <strong className="student-modern-status-value">{card.value}</strong>
          </article>
        ))}
      </section>

      <section className="student-dashboard-clean-grid">
        <article className="student-dashboard-clean-card">
          <div className="student-modern-card-head">
            <h3>Profile Summary</h3>
          </div>
          <p><strong>Name:</strong> {fullName}</p>
          <p><strong>Role:</strong> Student</p>
          <p><strong>Center:</strong> Colombo Center</p>
          <div className="student-dashboard-clean-actions">
            <Link className="solid-btn" to="/student/profile#update-profile">Update Profile</Link>
          </div>
        </article>

        <article className="student-dashboard-clean-card">
          <div className="student-modern-card-head">
            <h3>Quick Actions</h3>
          </div>
          <div className="student-dashboard-clean-actions student-dashboard-clean-actions-stack">
            <Link className="ghost-btn" to="/student/facilities">Open Facilities</Link>
            <Link className="ghost-btn" to="/student/support">Open Support</Link>
            <Link className="ghost-btn" to="/student/support/raise">Raise Ticket</Link>
          </div>
        </article>

        <article className="student-dashboard-clean-card student-dashboard-clean-card-wide">
          <div className="student-modern-card-head">
            <h3>Recent Activity</h3>
          </div>
          <ul className="list-clean student-modern-mini-list">
            {recentActivity.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>
    </StudentPortalShell>
  );
}

export default StudentDashboard;
