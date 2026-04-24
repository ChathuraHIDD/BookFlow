import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/useAuth";
import AdminProfile from "./pages/AdminProfile";
import AdminFacilities from "./pages/AdminFacilities";
import AdminNotifications from "./pages/AdminNotifications";
import AdminBookingManagement from "./pages/AdminBookingManagement";
import AdminTicketManagement from "./pages/AdminTicketManagement";
import AdminUserManagement from "./pages/AdminUserManagement";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NotificationPanel from "./pages/NotificationPanel";
import Register from "./pages/Register";
import TechnicianTicketDetail from "./pages/TechnicianTicketDetail";
import TechnicianTicketManagement from "./pages/TechnicianTicketManagement";
import StudentDashboard from "./pages/StudentDashboard";
import StudentFacilityBookingBoard from "./pages/StudentFacilityBookingBoard";
import StudentFacilityCatalogDetail from "./pages/StudentFacilityCatalogDetail";
import StudentFacilityCategoryDetail from "./pages/StudentFacilityCategoryDetail";
import StudentFacilityFloors from "./pages/StudentFacilityFloors";
import StudentFacilities from "./pages/StudentFacilities";
import StudentResourceBooking from "./pages/StudentResourceBooking";
import StudentSupport from "./pages/StudentSupport";
import StudentSupportRaise from "./pages/StudentSupportRaise";
import StudentSupportTicket from "./pages/StudentSupportTicket";
import UserProfile from "./pages/UserProfile";
import { homePathByRole } from "./utils/role";

function RoleHomeRedirect() {
  const { ready, isAuthenticated, user } = useAuth();

  if (!ready) {
    return <div className="page-wrap center-screen"><div className="card">Loading...</div></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={homePathByRole(user.role)} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<RoleHomeRedirect />} />

      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <UserProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/facilities"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentFacilities />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/facilities/buildings/:buildingId"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentFacilityFloors />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/facilities/buildings/:buildingId/floors/:floorNumber"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentFacilityBookingBoard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/facilities/catalog/:facilitySlug"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentFacilityCatalogDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/facilities/categories/:categorySlug"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentFacilityCategoryDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/resources/:slug"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentResourceBooking />
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff/profile"
        element={
          <ProtectedRoute allowedRoles={["staff_member"]}>
            <UserProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute allowedRoles={["student", "staff_member", "technician"]}>
            <NotificationPanel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/support"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentSupport />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/support/raise"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentSupportRaise />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/support/:id"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentSupportTicket />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminUserManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/facilities"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminFacilities />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/tickets"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminTicketManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/bookings"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminBookingManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminNotifications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/technician/tickets"
        element={
          <ProtectedRoute allowedRoles={["technician", "staff_member"]}>
            <TechnicianTicketManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/technician/tickets/:ticketId"
        element={
          <ProtectedRoute allowedRoles={["technician", "staff_member"]}>
            <TechnicianTicketDetail />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
