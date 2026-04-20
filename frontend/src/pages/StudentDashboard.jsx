import { Link } from "react-router-dom";

import StudentPortalShell from "../components/StudentPortalShell";
import { useAuth } from "../context/useAuth";
import heroGraphic from "../assets/hero.png";
import supportIllustration from "../assets/support-illustration.svg";

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
              <p>{fullName}</p>
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
    </StudentPortalShell>
  );
}

export default StudentDashboard;
