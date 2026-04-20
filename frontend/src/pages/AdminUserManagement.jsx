import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { NavLink } from "react-router-dom";
import PortalLayout from "../components/PortalLayout";
import api, { readApiError } from "../services/api";
import {
  approveProfileRequest,
  declineProfileRequest,
  fetchPendingProfileRequests,
} from "../services/profile";
import { formatEnumText, normalizeRole, ROLE_OPTIONS } from "../utils/role";

const CENTER_OPTIONS = ["COLOMBO_CENTER", "MATHARA_CENTER", "JAFFNA_CENTER"];
const DEGREE_OPTIONS = ["IT", "EN", "ART", "BS", "LAW"];
const CAMPUS_YEAR_OPTIONS = ["FIRST", "SECOND", "THIRD", "FOURTH"];

const emptyFilter = {
  q: "",
  email: "",
  role: "",
};

function Icon({ name, className = "admin-icon" }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  };

  switch (name) {
    case "users":
      return (
        <svg {...common}>
          <path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9.5" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M20 19v-1.2a3.2 3.2 0 0 0-2.2-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M15.8 4.2a3 3 0 0 1 0 5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "student":
      return (
        <svg {...common}>
          <path d="M3 8.5 12 4l9 4.5-9 4.5L3 8.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M7 11.5V15c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "staff":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9 5V3.8M15 5V3.8M4 10h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "admin":
      return (
        <svg {...common}>
          <path d="m12 3 7 3v6c0 4.2-2.7 7.4-7 9-4.3-1.6-7-4.8-7-9V6l7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="m9.5 12 1.8 1.8 3.4-3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "reset":
      return (
        <svg {...common}>
          <path d="M20 11a8 8 0 1 1-2.3-5.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M20 4v5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "download":
      return (
        <svg {...common}>
          <path d="M12 4v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="m8.5 10.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 19h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "edit":
      return (
        <svg {...common}>
          <path d="M4 20h4l10-10a2 2 0 0 0-4-4L4 16v4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "delete":
      return (
        <svg {...common}>
          <path d="M4 7h16M9 7V5h6v2m-8 0 1 12h8l1-12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M8 4h3l1.2 3.3-1.8 1.8a13 13 0 0 0 4.5 4.5l1.8-1.8L20 13v3c0 .6-.4 1-1 1C11.8 17 7 12.2 7 5c0-.6.4-1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "approve":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
          <path d="m9.2 12.2 2 2 3.8-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "decline":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
          <path d="m9.5 9.5 5 5m0-5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

const getUserInitials = (name) => {
  if (!name) {
    return "U";
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return initials || "U";
};

function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(emptyFilter);
  const [editingUserId, setEditingUserId] = useState("");
  const [editForm, setEditForm] = useState(null);
  const [profileRequests, setProfileRequests] = useState([]);
  const [reviewNotes, setReviewNotes] = useState({});

  const roleCounts = {
    all: users.length,
    student: users.filter((user) => normalizeRole(user.role) === "student").length,
    staff_member: users.filter((user) => normalizeRole(user.role) === "staff_member").length,
    admin: users.filter((user) => normalizeRole(user.role) === "admin").length,
  };

  const studentRatio = useMemo(() => {
    if (!roleCounts.all) {
      return 0;
    }
    return Math.round((roleCounts.student / roleCounts.all) * 100);
  }, [roleCounts.all, roleCounts.student]);

  const overviewPieGradient = useMemo(() => {
    if (!roleCounts.all) {
      return "conic-gradient(#dbe7f7 0deg 360deg)";
    }

    const students = (roleCounts.student / roleCounts.all) * 360;
    const staff = (roleCounts.staff_member / roleCounts.all) * 360;
    const admins = (roleCounts.admin / roleCounts.all) * 360;

    const studentEnd = students;
    const staffEnd = students + staff;
    const adminEnd = students + staff + admins;

    return `conic-gradient(
      #3565b0 0deg ${studentEnd}deg,
      #6f95d4 ${studentEnd}deg ${staffEnd}deg,
      #1f3f77 ${staffEnd}deg ${adminEnd}deg,
      #dbe7f7 ${adminEnd}deg 360deg
    )`;
  }, [roleCounts.admin, roleCounts.all, roleCounts.staff_member, roleCounts.student]);

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

  const loadRequests = async () => {
    try {
      const data = await fetchPendingProfileRequests();
      setProfileRequests(data);
    } catch (err) {
      setError(readApiError(err));
    }
  };

  useEffect(() => {
    const load = async () => {
      await Promise.all([loadUsers(), loadRequests()]);
    };

    load();
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

  const onRoleChipClick = async (roleValue) => {
    const next = { ...filters, role: roleValue };
    setFilters(next);
    await loadUsers(next);
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

  const updateReviewNote = (requestId, value) => {
    setReviewNotes((prev) => ({ ...prev, [requestId]: value }));
  };

  const reviewRequest = async (requestId, decision) => {
    setSaving(true);
    setError("");

    try {
      const note = reviewNotes[requestId] || "";
      if (decision === "approve") {
        await approveProfileRequest(requestId, note);
      } else {
        await declineProfileRequest(requestId, note);
      }

      await Promise.all([loadUsers(filters), loadRequests()]);
      setReviewNotes((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setSaving(false);
    }
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
      subtitle="Search, edit, remove, export user records, and review student profile update requests."
      loading={loading}
    >
      {error ? <p className="error-text">{error}</p> : null}

      <section className="admin-vision-layout admin-user-vision-layout">
        <aside className="admin-vision-sidebar">
          <div className="admin-vision-brand">NNIC Admin</div>
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

        <div className="admin-vision-main admin-user-vision-main">
          <section className="admin-user-panel">
            <div className="admin-section-head">
              <div>
                <p className="student-modern-section-label">Overview</p>
                <h3 className="admin-section-title">
                  <Icon name="users" />
                  Management Overview
                </h3>
              </div>
              <span className="request-status-pill">Live role analytics</span>
            </div>

            <div className="admin-vision-top-grid">
              <article className="admin-vision-card admin-vision-card-ring">
                <h3>Total Active Students</h3>
                <p className="helper-text">Current ratio in filtered user set</p>
                <div
                  className="admin-vision-progress-ring"
                  style={{ background: `conic-gradient(#3565b0 ${studentRatio}%, #dbe7f7 ${studentRatio}% 100%)` }}
                >
                  <div>
                    <strong>{roleCounts.student}</strong>
                    <span>{studentRatio}% of all users</span>
                  </div>
                </div>
              </article>

              <article className="admin-vision-card admin-vision-card-bars">
                <h3>Role Growth Snapshot</h3>
                <p className="helper-text">Live counts from user management</p>
                <div className="admin-vision-bars">
                  <div>
                    <span>Users</span>
                    <strong style={{ height: `${Math.max(24, roleCounts.all * 10)}px` }} />
                    <em>{roleCounts.all}</em>
                  </div>
                  <div>
                    <span>Students</span>
                    <strong style={{ height: `${Math.max(24, roleCounts.student * 10)}px` }} />
                    <em>{roleCounts.student}</em>
                  </div>
                  <div>
                    <span>Staff</span>
                    <strong style={{ height: `${Math.max(24, roleCounts.staff_member * 10)}px` }} />
                    <em>{roleCounts.staff_member}</em>
                  </div>
                  <div>
                    <span>Admins</span>
                    <strong style={{ height: `${Math.max(24, roleCounts.admin * 10)}px` }} />
                    <em>{roleCounts.admin}</em>
                  </div>
                </div>
              </article>

              <article className="admin-vision-card admin-vision-card-pie">
                <h3>User Role Composition</h3>
                <p className="helper-text">Distribution in current filtered result</p>
                <div className="admin-vision-pie" style={{ background: overviewPieGradient }} />
                <div className="admin-vision-legend">
                  <span><i className="admin-vision-dot students" />Students</span>
                  <span><i className="admin-vision-dot staff" />Staff</span>
                  <span><i className="admin-vision-dot admins" />Admins</span>
                </div>
              </article>
            </div>
          </section>

          <section className="admin-user-panel admin-profile-requests-panel">
            <div className="student-modern-card-head">
              <div>
                <p className="student-modern-section-label">Approvals</p>
                <h3 className="admin-section-title">
                  <Icon name="approve" />
                  Pending Profile Requests
                </h3>
              </div>
            </div>

            {profileRequests.length === 0 ? (
              <p className="helper-text">No pending profile update requests.</p>
            ) : (
              <div className="admin-profile-request-list">
                {profileRequests.map((request) => (
                  <article key={request.id} className="admin-profile-request-card">
                    <div className="admin-profile-request-summary">
                      <div>
                        <strong>{request.userFullName}</strong>
                        <p className="helper-text">{request.userEmail}</p>
                      </div>
                      <span className="request-status-pill">{request.status}</span>
                    </div>

                    <div className="admin-profile-request-grid">
                      <p><strong>Requested Name:</strong> {request.fullName}</p>
                      <p><strong>Requested Email:</strong> {request.email}</p>
                      <p><strong>Telephone:</strong> {request.telephone}</p>
                      <p><strong>Campus Year:</strong> {formatEnumText(request.campusYear)}</p>
                      <p><strong>Semester:</strong> {request.semester}</p>
                      <p><strong>Center:</strong> {formatEnumText(request.center)}</p>
                      <p><strong>Degree:</strong> {formatEnumText(request.degreeProgram)}</p>
                      <p className="helper-text">Requested at: {request.requestedAt}</p>
                    </div>

                    <label className="admin-profile-note-field">
                      Admin Note
                      <textarea
                        rows="2"
                        value={reviewNotes[request.id] || ""}
                        onChange={(event) => updateReviewNote(request.id, event.target.value)}
                        placeholder="Optional note for the student"
                      />
                    </label>

                    <div className="admin-user-toolbar-actions">
                      <button className="solid-btn admin-action-btn" type="button" onClick={() => reviewRequest(request.id, "approve")} disabled={saving}>
                        <Icon name="approve" className="admin-icon-small" />
                        Approve
                      </button>
                      <button className="ghost-btn danger-btn admin-action-btn" type="button" onClick={() => reviewRequest(request.id, "decline")} disabled={saving}>
                        <Icon name="decline" className="admin-icon-small" />
                        Decline
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="admin-user-panel">
            <div className="admin-section-head">
              <div>
                <p className="student-modern-section-label">Directory</p>
                <h3 className="admin-section-title">
                  <Icon name="users" />
                  User Controls
                </h3>
              </div>
              <span className="request-status-pill">{users.length} records</span>
            </div>

            <div className="admin-user-chip-row">
              <button
                type="button"
                className={`admin-user-chip${filters.role === "" ? " admin-user-chip-active" : ""}`}
                onClick={() => onRoleChipClick("")}
              >
                <Icon name="users" className="admin-icon-small" />
                All <span>{roleCounts.all}</span>
              </button>
              <button
                type="button"
                className={`admin-user-chip${filters.role === "student" ? " admin-user-chip-active" : ""}`}
                onClick={() => onRoleChipClick("student")}
              >
                <Icon name="student" className="admin-icon-small" />
                Students <span>{roleCounts.student}</span>
              </button>
              <button
                type="button"
                className={`admin-user-chip${filters.role === "staff_member" ? " admin-user-chip-active" : ""}`}
                onClick={() => onRoleChipClick("staff_member")}
              >
                <Icon name="staff" className="admin-icon-small" />
                Staff <span>{roleCounts.staff_member}</span>
              </button>
              <button
                type="button"
                className={`admin-user-chip${filters.role === "admin" ? " admin-user-chip-active" : ""}`}
                onClick={() => onRoleChipClick("admin")}
              >
                <Icon name="admin" className="admin-icon-small" />
                Admins <span>{roleCounts.admin}</span>
              </button>
            </div>

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

              <div className="admin-user-toolbar-actions">
                <button className="solid-btn admin-action-btn" type="submit" disabled={saving}>
                  <Icon name="search" className="admin-icon-small" />
                  Apply
                </button>
                <button className="ghost-btn admin-action-btn" type="button" onClick={onReset} disabled={saving}>
                  <Icon name="reset" className="admin-icon-small" />
                  Reset
                </button>
                <button className="ghost-btn admin-action-btn" type="button" onClick={onExportPdf} disabled={saving}>
                  <Icon name="download" className="admin-icon-small" />
                  Download PDF
                </button>
              </div>
            </form>
          </section>

          {editForm ? (
            <section className="admin-user-panel">
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
                  <button className="solid-btn admin-action-btn" type="submit" disabled={saving}>
                    <Icon name="edit" className="admin-icon-small" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button className="ghost-btn admin-action-btn" type="button" onClick={onCancelEdit} disabled={saving}>
                    <Icon name="decline" className="admin-icon-small" />
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          <section className="admin-user-panel">
            <div className="admin-user-list-head">
              <h3 className="admin-section-title">
                <Icon name="users" />
                User List
              </h3>
              <p className="helper-text">Manage and track all users in one view.</p>
            </div>

            <div className="admin-user-card-list">
              {users.map((user) => (
                <article key={user.id} className="admin-user-list-card">
                  <div className="admin-user-list-row admin-user-list-row-top">
                    <div className="admin-user-main">
                      <span className="admin-user-avatar">{getUserInitials(user.fullName)}</span>
                      <div>
                      <strong>{user.fullName}</strong>
                      <span className="helper-text">ID: {user.id}</span>
                      </div>
                    </div>
                    <div className="admin-user-contact">
                      <span>
                        <Icon name="mail" className="admin-icon-tiny" />
                        {user.email}
                      </span>
                      <span>
                        <Icon name="phone" className="admin-icon-tiny" />
                        {user.telephone || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="admin-user-list-row admin-user-list-row-meta">
                    <span><strong>Role:</strong> {formatEnumText(user.role)}</span>
                    <span><strong>Center:</strong> {formatEnumText(user.center)}</span>
                    <span><strong>Degree:</strong> {formatEnumText(user.degreeProgram)}</span>
                    <span><strong>Semester:</strong> {user.semester || "-"}</span>
                  </div>

                  <div className="admin-user-list-row admin-user-list-row-actions">
                    <button
                      className="ghost-btn admin-action-btn"
                      type="button"
                      onClick={() => onStartEdit(user)}
                      disabled={saving}
                    >
                      <Icon name="edit" className="admin-icon-small" />
                      Edit User
                    </button>
                    <button
                      className="ghost-btn danger-btn admin-action-btn"
                      type="button"
                      onClick={() => onDeleteUser(user)}
                      disabled={saving}
                    >
                      <Icon name="delete" className="admin-icon-small" />
                      Delete User
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </PortalLayout>
  );
}

export default AdminUserManagement;
