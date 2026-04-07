import { useEffect, useState } from "react";
import PortalLayout from "../components/PortalLayout";
import api, { readApiError } from "../services/api";
import { formatEnumText } from "../utils/role";

function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data } = await api.get("/admin/users");
        setUsers(data);
      } catch (err) {
        setError(readApiError(err));
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  return (
    <PortalLayout
      title="Admin User Management"
      subtitle="All registered users are loaded from the BookFlow database."
      loading={loading}
    >
      {error ? <p className="error-text">{error}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Telephone</th>
              <th>Center</th>
              <th>Degree</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>{formatEnumText(user.role)}</td>
                <td>{user.telephone || "-"}</td>
                <td>{formatEnumText(user.center)}</td>
                <td>{formatEnumText(user.degreeProgram)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PortalLayout>
  );
}

export default AdminUserManagement;
