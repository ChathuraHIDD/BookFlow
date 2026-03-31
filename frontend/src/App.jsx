import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NotificationPanel from "./pages/NotificationPanel";
import UserProfile from "./pages/UserProfile";
import AdminUserManagement from "./pages/AdminUserManagement";

function App() {
  return (
    <div>
      <h1>Book Flow</h1>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/notifications" element={<NotificationPanel />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/admin/users" element={<AdminUserManagement />} />
      </Routes>
    </div>
  );
}

export default App;