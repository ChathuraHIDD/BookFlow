import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import PortalLayout from "../components/PortalLayout";
import api, { readApiError } from "../services/api";
import { formatEnumText, normalizeRole, ROLE_OPTIONS } from "../utils/role";

const CENTER_OPTIONS = ["COLOMBO_CENTER", "MATHARA_CENTER", "JAFFNA_CENTER"];
const DEGREE_OPTIONS = ["IT", "EN", "ART", "BS", "LAW"];
const CAMPUS_YEAR_OPTIONS = ["FIRST", "SECOND", "THIRD", "FOURTH"];

const emptyFilter = {
  q: "",
  email: "",
  role: "",
};

function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(emptyFilter);
  const [editingUserId, setEditingUserId] = useState("");
  const [editForm, setEditForm] = useState(null);

  const loadUsers = async (activeFilters = filters) => {
    setError("");
    setLoading(true);
    try {
      const params = {};
      if (activeFilters.q.trim()) params.q = activeFilters.q.trim();
      if (activeFilters.email.trim()) params.email = activeFilters.email.trim();
      if (activeFilters.role.trim()) params.role = activeFilters.role.trim();

      const { data } = await api.get("/admin/users", { params });
      setUsers(data);
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isStudent = editForm?.role === "student";
  const isStaffMember = editForm?.role === "staff_member";
  const needsStudentLikeFields = isStudent || isStaffMember;

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const onSearch = async (event) => {
    event.preventDefault();
    await loadUsers(filters);
  };

  const onReset = async () => {
    const reset = { ...emptyFilter };
    setFilters(reset);
    await loadUsers(reset);
  };

  const onDeleteUser = async (user) => {
    const confirmed = window.confirm(`Delete user ${user.fullName} (${user.email})?`);
    if (!confirmed) {
      return;
    }

    setError("");
    setSaving(true);
    try {
      await api.delete(`/admin/users/${user.id}`);
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      if (editingUserId === user.id) {
        setEditingUserId("");
        setEditForm(null);
      }
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const onStartEdit = (user) => {
    setEditingUserId(user.id);
    setEditForm({
      fullName: user.fullName || "",
      email: user.email || "",
      role: normalizeRole(user.role),
      telephone: user.telephone || "",
      campusYear: user.campusYear || "FIRST",
      semester: user.semester || 1,
      center: user.center || "COLOMBO_CENTER",
      degreeProgram: user.degreeProgram || "IT",
    });
  };

  const updateEditField = (key, value) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const onCancelEdit = () => {
    setEditingUserId("");
    setEditForm(null);
  };

  const onSaveEdit = async (event) => {
    event.preventDefault();
    if (!editingUserId || !editForm) {
      return;
    }

    const payload = {
      fullName: editForm.fullName,
      email: editForm.email,
      role: editForm.role,
      telephone: needsStudentLikeFields ? editForm.telephone : null,
      center: needsStudentLikeFields ? editForm.center : null,
      degreeProgram: needsStudentLikeFields ? editForm.degreeProgram : null,
      campusYear: isStudent ? editForm.campusYear : null,
      semester: isStudent ? Number(editForm.semester) : null,
    };

    setError("");
    setSaving(true);
    try {
      const { data } = await api.put(`/admin/users/${editingUserId}`, payload);
      setUsers((prev) => prev.map((user) => (user.id === data.id ? data : user)));
      setEditingUserId("");
      setEditForm(null);
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const onExportPdf = () => {
    if (!users.length) {
      setError("No users available to export.");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("NNIC Smart Campus - User List", 14, 16);
    doc.setFontSize(10);
    doc.text(`Exported at: ${new Date().toLocaleString()}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [["Name", "Email", "Role", "Telephone", "Center", "Campus Year", "Semester", "Degree"]],
      body: users.map((user) => [
        user.fullName,
        user.email,
        formatEnumText(user.role),
        user.telephone || "-",
        formatEnumText(user.center),
        formatEnumText(user.campusYear),
        user.semester || "-",
        formatEnumText(user.degreeProgram),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [31, 71, 140] },
    });

    doc.save("nnic-smart-campus-users.pdf");
  };

  return (
    <PortalLayout
      title="Admin User Management"
      subtitle="Search, edit, remove, and export user records from the NNIC smart campus platform."
      loading={loading}
    >
      {error ? <p className="error-text">{error}</p> : null}

      <form className="admin-user-toolbar" onSubmit={onSearch}>
        <label>
          Search
          <input
            type="text"
            value={filters.q}
            onChange={(event) => updateFilter("q", event.target.value)}
            placeholder="Search name or email"
          />
        </label>

        <label>
          Email Filter
          <input
            type="text"
            value={filters.email}
            onChange={(event) => updateFilter("email", event.target.value)}
            placeholder="Contains email"
          />
        </label>

        <label>
          Role Filter
          <select value={filters.role} onChange={(event) => updateFilter("role", event.target.value)}>
            <option value="">All roles</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </label>

        <div className="admin-user-toolbar-actions">
          <button className="solid-btn" type="submit" disabled={saving}>
            Apply
          </button>
          <button className="ghost-btn" type="button" onClick={onReset} disabled={saving}>
            Reset
          </button>
          <button className="ghost-btn" type="button" onClick={onExportPdf} disabled={saving}>
            Download PDF
          </button>
        </div>
      </form>

      {editForm ? (
        <form className="admin-user-edit-card" onSubmit={onSaveEdit}>
          <h3>Edit User</h3>
          <div className="admin-user-edit-grid">
            <label>
              Full Name
              <input
                type="text"
                value={editForm.fullName}
                onChange={(event) => updateEditField("fullName", event.target.value)}
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={editForm.email}
                onChange={(event) => updateEditField("email", event.target.value)}
                required
              />
            </label>

            <label>
              Role
              <select
                value={editForm.role}
                onChange={(event) => updateEditField("role", event.target.value)}
                required
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>

            {needsStudentLikeFields ? (
              <label>
                Telephone
                <input
                  type="text"
                  value={editForm.telephone}
                  onChange={(event) => updateEditField("telephone", event.target.value)}
                  required
                />
              </label>
            ) : null}

            {isStudent ? (
              <label>
                Campus Year
                <select
                  value={editForm.campusYear}
                  onChange={(event) => updateEditField("campusYear", event.target.value)}
                >
                  {CAMPUS_YEAR_OPTIONS.map((year) => (
                    <option key={year} value={year}>
                      {formatEnumText(year)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {isStudent ? (
              <label>
                Semester
                <select
                  value={editForm.semester}
                  onChange={(event) => updateEditField("semester", Number(event.target.value))}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                </select>
              </label>
            ) : null}

            {needsStudentLikeFields ? (
              <label>
                Center
                <select value={editForm.center} onChange={(event) => updateEditField("center", event.target.value)}>
                  {CENTER_OPTIONS.map((center) => (
                    <option key={center} value={center}>
                      {formatEnumText(center)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {needsStudentLikeFields ? (
              <label>
                Degree Program
                <select
                  value={editForm.degreeProgram}
                  onChange={(event) => updateEditField("degreeProgram", event.target.value)}
                >
                  {DEGREE_OPTIONS.map((degree) => (
                    <option key={degree} value={degree}>
                      {degree}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          <div className="admin-user-toolbar-actions">
            <button className="solid-btn" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button className="ghost-btn" type="button" onClick={onCancelEdit} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

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
              <th>Actions</th>
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
                <td>
                  <div className="admin-user-row-actions">
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => onStartEdit(user)}
                      disabled={saving}
                    >
                      Edit
                    </button>
                    <button
                      className="ghost-btn danger-btn"
                      type="button"
                      onClick={() => onDeleteUser(user)}
                      disabled={saving}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PortalLayout>
  );
}

export default AdminUserManagement;
