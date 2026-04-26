import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import PortalLayout from "../components/PortalLayout";
import api, { readApiError } from "../services/api";
import {
  approveProfileRequest,
  declineProfileRequest,
  fetchPendingProfileRequests,
} from "../services/profile";
import { formatEnumText, normalizeRole, ROLE_OPTIONS } from "../utils/role";
import "./AdminUserManagement.css";

const CENTER_OPTIONS = ["COLOMBO_CENTER", "MATHARA_CENTER", "JAFFNA_CENTER"];
const DEGREE_OPTIONS = ["IT", "EN", "ART", "BS", "LAW"];
const CAMPUS_YEAR_OPTIONS = ["FIRST", "SECOND", "THIRD", "FOURTH"];

function Icon({ name, className = "admin-icon" }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": true };
  switch (name) {
    case "users": return <svg {...common}><path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9.5" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" /><path d="M20 19v-1.2a3.2 3.2 0 0 0-2.2-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M15.8 4.2a3 3 0 0 1 0 5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
    case "approve": return <svg {...common}><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" /><path d="m9.2 12.2 2 2 3.8-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case "decline": return <svg {...common}><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" /><path d="m9.5 9.5 5 5m0-5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
    case "search": return <svg {...common}><circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" /><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
    case "download": return <svg {...common}><path d="M12 4v10M8.5 10.5 12 14l3.5-3.5M5 19h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    default: return null;
  }
}

const getUserInitials = (n) => n ? n.split(" ").filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join("") : "U";

function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ q: "", email: "", role: "" });
  const [editingUserId, setEditingUserId] = useState("");
  const [editForm, setEditForm] = useState(null);
  const [profileRequests, setProfileRequests] = useState([]);
  const [reviewNotes, setReviewNotes] = useState({});

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (filters.q.trim()) params.q = filters.q.trim();
      if (filters.email.trim()) params.email = filters.email.trim();
      if (filters.role.trim()) params.role = filters.role.trim();

      const [usersRes, reqRes] = await Promise.all([
        api.get("/admin/users", { params }),
        fetchPendingProfileRequests()
      ]);
      setUsers(usersRes.data);
      setProfileRequests(reqRes);
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [filters.role]); // Reload when role chip changes

  const counts = useMemo(() => {
    const s = { total: users.length, student: 0, staff: 0, admin: 0, technician: 0 };
    users.forEach(u => {
      const r = normalizeRole(u.role);
      if (s[r] !== undefined) s[r]++;
    });
    return s;
  }, [users]);

  const pieData = useMemo(() => [
    { name: "Students", value: counts.student, color: "#3B82F6" },
    { name: "Staff", value: counts.staff, color: "#10B981" },
    { name: "Admins", value: counts.admin, color: "#6366F1" },
    { name: "Technicians", value: counts.technician, color: "#8B5CF6" },
  ].filter(d => d.value > 0), [counts]);

  const handleReview = async (id, dec) => {
    try {
      setSaving(true);
      const note = reviewNotes[id] || "";
      if (dec === "approve") await approveProfileRequest(id, note);
      else await declineProfileRequest(id, note);
      await loadData();
    } catch (err) { setError(readApiError(err)); }
    finally { setSaving(false); }
  };

  const onSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUserId || !editForm) return;
    try {
      setSaving(true);
      await api.put(`/admin/users/${editingUserId}`, editForm);
      setEditingUserId("");
      setEditForm(null);
      await loadData();
    } catch (err) { setError(readApiError(err)); }
    finally { setSaving(false); }
  };

  const onExportPdf = () => {
    if (!users.length) {
      setError("No users available to export.");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // 1. Header Branded Background
    doc.setFillColor(31, 71, 140); // NNIC Deep Blue
    doc.rect(0, 0, pageWidth, 80, 'F');

    // 2. Official Logo Image
    try {
      doc.addImage("/nnic-logo-icon.png", "PNG", 40, 10, 60, 60);
    } catch (e) {
      // Fallback
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(40, 15, 50, 50, 10, 10, 'F');
      doc.setTextColor(31, 71, 140);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("N", 54, 48);
    }
    
    // 3. Title & Metadata
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("NNIC SMART CAMPUS", 115, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`ADMINISTRATIVE USER DIRECTORY | EXPORTED: ${new Date().toLocaleString()}`, 115, 55);

    // 4. User Table
    autoTable(doc, {
      startY: 100,
      head: [["Name", "Email", "Role", "Center", "Degree", "Campus Year", "Telephone"]],
      body: users.map(u => [
        u.fullName, 
        u.email, 
        formatEnumText(u.role), 
        formatEnumText(u.center), 
        formatEnumText(u.degreeProgram),
        formatEnumText(u.campusYear),
        u.telephone || "-"
      ]),
      headStyles: { 
        fillColor: [45, 55, 72], // Slate 700
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'left'
      },
      bodyStyles: { 
        fontSize: 9,
        textColor: [30, 41, 59], // Slate 800
        cellPadding: 8
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Slate 50
      },
      margin: { left: 40, right: 40 },
      theme: 'grid'
    });

    // 5. Footer
    const footerY = doc.internal.pageSize.getHeight() - 30;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text("CONFIDENTIAL DOCUMENT: Internal Use Only. This report contains sensitive student information.", 40, footerY);
    doc.text(`Page 1 | Total Records: ${users.length}`, pageWidth - 140, footerY);

    doc.save(`nnic-user-directory-${new Date().getTime()}.pdf`);
  };

  return (
    <PortalLayout
      title="User Management"
      subtitle="Comprehensive control over campus identities, role assignments, and profile verification."
      pageClassName="admin-users-page"
    >
      <div className="admin-users-stack">
        <section className="admin-user-banner">
          <div className="admin-user-banner-top">
            <div className="admin-user-banner-copy">
              <span className="admin-user-kicker">Identity Governance</span>
              <h2>Campus User Directory</h2>
              <p>Review and verify student profile updates, manage role permissions, and export campus-wide user records.</p>
            </div>
            <div className="admin-user-banner-actions">
              <button className="solid-btn" onClick={onExportPdf}><Icon name="download" style={{ width: 16, height: 16, marginRight: 8 }} />Export PDF</button>
              <button className="ghost-btn" onClick={() => { setFilters({ q: "", email: "", role: "" }); loadData(); }}>Refresh Data</button>
            </div>
          </div>
          <div className="admin-user-chip-row">
            <button className={`admin-user-chip ${filters.role === "" ? "admin-user-chip-active" : ""}`} onClick={() => setFilters(f => ({ ...f, role: "" }))}>
              All <strong>{counts.total}</strong>
            </button>
            <button className={`admin-user-chip ${filters.role === "student" ? "admin-user-chip-active" : ""}`} onClick={() => setFilters(f => ({ ...f, role: "student" }))}>
              Students <strong>{counts.student}</strong>
            </button>
            <button className={`admin-user-chip ${filters.role === "staff_member" ? "admin-user-chip-active" : ""}`} onClick={() => setFilters(f => ({ ...f, role: "staff_member" }))}>
              Staff <strong>{counts.staff}</strong>
            </button>
            <button className={`admin-user-chip ${filters.role === "admin" ? "admin-user-chip-active" : ""}`} onClick={() => setFilters(f => ({ ...f, role: "admin" }))}>
              Admins <strong>{counts.admin}</strong>
            </button>
          </div>
        </section>

        <section className="admin-user-stats-grid">
          <article className="admin-user-stat-card admin-user-stat-card-total"><h3>Users</h3><p className="metric-number">{counts.total}</p></article>
          <article className="admin-user-stat-card admin-user-stat-card-students"><h3>Students</h3><p className="metric-number">{counts.student}</p></article>
          <article className="admin-user-stat-card admin-user-stat-card-staff"><h3>Staff</h3><p className="metric-number">{counts.staff}</p></article>
          <article className="admin-user-stat-card admin-user-stat-card-admins"><h3>Admins</h3><p className="metric-number">{counts.admin}</p></article>
        </section>

        <section className="admin-user-chart-board">
          <article className="admin-user-chart-card">
            <div className="admin-user-chart-head"><h4>Role Composition</h4></div>
            <div className="admin-user-chart-body">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                    {pieData.map(d => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>
          <article className="admin-user-chart-card admin-user-chart-card-wide">
            <div className="admin-user-chart-head"><h4>User Growth Overview</h4></div>
            <div className="admin-user-chart-body">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={pieData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        {profileRequests.length > 0 && (
          <section className="admin-user-panel" style={{ background: 'rgba(240, 249, 255, 0.6)' }}>
            <div className="admin-booking-panel-head">
              <div>
                <span className="admin-user-kicker">Pending Approvals</span>
                <h3>Profile Verification Queue</h3>
                <p>Review student requests for information updates and identity verification.</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {profileRequests.map(r => (
                <div key={r.id} style={{ background: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #e0f2fe' }}>
                  <strong>{r.fullName}</strong>
                  <div className="helper-text">{r.email}</div>
                  <div style={{ margin: '12px 0', fontSize: '0.85rem', display: 'grid', gap: '4px' }}>
                    <div>Year: {formatEnumText(r.campusYear)} · Sem {r.semester}</div>
                    <div>Degree: {r.degreeProgram}</div>
                  </div>
                  <textarea 
                    placeholder="Decision note..." 
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}
                    value={reviewNotes[r.id] || ""}
                    onChange={e => setReviewNotes(prev => ({ ...prev, [r.id]: e.target.value }))}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button className="solid-btn" style={{ flex: 1, padding: '6px' }} onClick={() => handleReview(r.id, "approve")}>Approve</button>
                    <button className="ghost-btn" style={{ flex: 1, padding: '6px', color: '#ef4444' }} onClick={() => handleReview(r.id, "decline")}>Decline</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="admin-user-panel">
          <div className="admin-booking-panel-head">
            <div>
              <h3>Directory Listing</h3>
              <p>Search and manage {users.length} active records in the campus database.</p>
            </div>
            <div className="admin-booking-filter-bar">
              <label className="admin-booking-filter-field">Search<input value={filters.q} onChange={e => setFilters(f => ({ ...f, q: e.target.value }))} onBlur={loadData} placeholder="Name or email..." /></label>
              <label className="admin-booking-filter-field">Email Filter<input value={filters.email} onChange={e => setFilters(f => ({ ...f, email: e.target.value }))} onBlur={loadData} placeholder="Contains..." /></label>
            </div>
          </div>

          <div className="admin-user-table-wrap">
            <table className="admin-user-table">
              <thead>
                <tr>
                  <th>Identity</th>
                  <th>Contact Info</th>
                  <th>Role</th>
                  <th>Center & Degree</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="admin-user-avatar">{getUserInitials(u.fullName)}</span>
                        <div className="admin-booking-table-main">
                          <strong>{u.fullName}</strong>
                          <span>ID: {u.id.slice(-6).toUpperCase()}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="admin-booking-table-main">
                        <strong>{u.email}</strong>
                        <span>{u.telephone || "No phone"}</span>
                      </div>
                    </td>
                    <td><span className={`admin-booking-status-badge`}>{formatEnumText(u.role)}</span></td>
                    <td>
                      <div className="admin-booking-table-main">
                        <strong>{formatEnumText(u.center)}</strong>
                        <span>{u.degreeProgram}</span>
                      </div>
                    </td>
                    <td>
                      <button className="ghost-btn" onClick={() => { setEditingUserId(u.id); setEditForm(u); }}>Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {editForm && createPortal(
          <div className="admin-booking-modal-overlay" onClick={e => e.target === e.currentTarget && setEditForm(null)}>
            <aside className="admin-booking-detail-modal" style={{ maxWidth: '500px' }}>
              <div className="admin-booking-modal-head">
                <div>
                  <p className="student-modern-section-label">Identity Control</p>
                  <h3>Edit User Account</h3>
                </div>
                <button className="ghost-btn" onClick={() => setEditForm(null)}>Close</button>
              </div>

              <form onSubmit={onSaveEdit} style={{ display: 'grid', gap: '16px' }}>
                <label className="admin-booking-filter-field">Full Name
                  <input value={editForm.fullName} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} required />
                </label>
                <label className="admin-booking-filter-field">Email
                  <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} required />
                </label>
                <label className="admin-booking-filter-field">Role
                  <select value={normalizeRole(editForm.role)} onChange={e => setEditForm({ ...editForm, role: e.target.value })} required>
                    {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>
                <label className="admin-booking-filter-field">Telephone
                  <input value={editForm.telephone || ""} onChange={e => setEditForm({ ...editForm, telephone: e.target.value })} />
                </label>
                <label className="admin-booking-filter-field">Center
                  <select value={editForm.center || "COLOMBO_CENTER"} onChange={e => setEditForm({ ...editForm, center: e.target.value })}>
                    {CENTER_OPTIONS.map(c => <option key={c} value={c}>{formatEnumText(c)}</option>)}
                  </select>
                </label>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" className="solid-btn" disabled={saving}>{saving ? "Saving..." : "Save Identity"}</button>
                  <button type="button" className="ghost-btn" onClick={() => setEditForm(null)}>Cancel</button>
                </div>
              </form>
            </aside>
          </div>,
          document.body
        )}
      </div>
    </PortalLayout>
  );
}

export default AdminUserManagement;
