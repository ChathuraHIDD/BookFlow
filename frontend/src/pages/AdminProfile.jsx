import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PortalLayout from "../components/PortalLayout";
import api, { readApiError } from "../services/api";

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
      subtitle="Live statistics from the user database with role-based management controls."
      loading={loading}
    >
      {error ? <p className="error-text">{error}</p> : null}

      {summary ? (
        <div className="stats-grid">
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
            <h3>Librarians</h3>
            <p className="metric-number">{summary.totalLibrarians}</p>
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
