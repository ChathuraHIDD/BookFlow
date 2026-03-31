import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { normalizeRole, profilePathByRole } from "../utils/role";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, ready, isAuthenticated } = useAuth();

  if (!ready) {
    return (
      <div className="page-wrap center-screen">
        <div className="card">Checking your session...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles?.length) {
    const currentRole = normalizeRole(user.role);
    const allowed = allowedRoles.map(normalizeRole);
    if (!allowed.includes(currentRole)) {
      return <Navigate to={profilePathByRole(currentRole)} replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
