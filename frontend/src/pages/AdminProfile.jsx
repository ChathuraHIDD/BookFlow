import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import PortalLayout from "../components/PortalLayout";
import api, { readApiError } from "../services/api";

const quickTasks = [
  {
    id: "ADM-1024",
    date: "2026-04-20",
    description: "Review pending profile update requests and resolve today.",
    note: "Open User Management and check profile approvals.",
    status: "Pending",
  },
  {
    id: "ADM-1025",
    date: "2026-04-20",
    description: "Validate new student onboarding records.",
    note: "Confirm role and center details are complete.",
    status: "In Review",
  },
  {
    id: "ADM-1026",
    date: "2026-04-20",
    description: "Audit facilities dashboard booking conflicts.",
    note: "Cross-check overlaps in high-demand slots.",
    status: "Pending",
  },
];

function AdminProfile() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const { data } = await api.get("/admin/dashboard");
        setSummary(data);
      } catch (err) {
        setError(readApiError(err));
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  return (
    <PortalLayout
      title="Admin Dashboard"
      subtitle="Live statistics from the NNIC smart campus user database with role-based management controls."
      loading={loading}
    >
      {error ? <p className="error-text">{error}</p> : null}

      <section className="admin-vision-layout">
        <aside className="admin-vision-sidebar">
          <div className="admin-vision-brand">
            <img src="/nnic-logo-icon.png" alt="NNIC logo" className="admin-vision-brand-logo" />
          </div>
          <nav className="admin-vision-nav" aria-label="Admin quick menu">
            <NavLink to="/admin/profile" className="admin-vision-link">
              Dashboard
            </NavLink>
            <NavLink to="/admin/users" className="admin-vision-link">
              User Management
            </NavLink>
            <NavLink to="/admin/facilities" className="admin-vision-link">
              Facilities
            </NavLink>
            <NavLink to="/admin/tickets" className="admin-vision-link">
              Ticket Management
            </NavLink>
            <NavLink to="/admin/bookings" className="admin-vision-link">
              Booking Management
            </NavLink>
            <NavLink to="/admin/notifications" className="admin-vision-link">
              Notifications
            </NavLink>
          </nav>
        </aside>

        <div className="admin-vision-main">
          <section className="admin-vision-task-panel">
            <div className="admin-vision-task-head">
              <h3>Admin Task List</h3>
              <div className="admin-vision-task-actions">
                <Link className="solid-btn" to="/admin/users">
                  Open User Management
                </Link>
                <Link className="ghost-btn" to="/admin/facilities">
                  Open Facilities Management
                </Link>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Task Description</th>
                    <th>ID</th>
                    <th>Task Note</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {quickTasks.map((task) => (
                    <tr key={task.id}>
                      <td>{task.date}</td>
                      <td>{task.description}</td>
                      <td>{task.id}</td>
                      <td>{task.note}</td>
                      <td>{task.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>

      {summary ? (
        <div className="stats-grid" style={{ marginTop: 16 }}>
          <article className="metric-card">
            <h3>Total Users</h3>
            <p className="metric-number">{summary.totalUsers}</p>
          </article>
          <article className="metric-card">
            <h3>Students</h3>
            <p className="metric-number">{summary.totalStudents}</p>
          </article>
          <article className="metric-card">
            <h3>Staff Members</h3>
            <p className="metric-number">{summary.totalStaffMembers}</p>
          </article>
          <article className="metric-card">
            <h3>Admins</h3>
            <p className="metric-number">{summary.totalAdmins}</p>
          </article>
        </div>
      ) : null}

      <div className="cta-row">
        <Link className="solid-btn" to="/admin/users">
          Open User Management
        </Link>
        <Link className="ghost-btn" to="/admin/facilities">
          Open Facilities Management
        </Link>
      </div>
    </PortalLayout>
  );
}

export default AdminProfile;
