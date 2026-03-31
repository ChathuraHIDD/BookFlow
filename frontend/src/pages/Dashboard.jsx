import { Navigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/useAuth";
import { profilePathByRole } from "../utils/role";

function Dashboard() {
  const { user, ready, isAuthenticated } = useAuth();

  if (ready && isAuthenticated) {
    return <Navigate to={profilePathByRole(user.role)} replace />;
  }

  return (
    <PortalLayout
      title="Professional Library Portal"
      subtitle="Access borrowing records, manage members, and run your library operations with role-based access."
    >
      <div className="stats-grid">
        <article className="metric-card">
          <h3>Student Access</h3>
          <p>Borrowed books, due reminders, and profile information in one place.</p>
        </article>
        <article className="metric-card">
          <h3>Staff Access</h3>
          <p>Same lending visibility as students with staff registration rules.</p>
        </article>
        <article className="metric-card">
          <h3>Librarian Access</h3>
          <p>Dedicated workspace for inventory visibility and book intake actions.</p>
        </article>
        <article className="metric-card">
          <h3>Admin Access</h3>
          <p>Live user analytics and management from real database records.</p>
        </article>
      </div>
    </PortalLayout>
  );
}

export default Dashboard;
