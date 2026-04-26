import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
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
import SupportDropdown from "../components/SupportDropdown";
import { readApiError } from "../services/api";
import {
  assignSupportTechnician,
  fetchAllSupportTickets,
  fetchTechnicians,
  updateSupportTicketStatus,
} from "../services/support";
import "./AdminTicketManagement.css";

function AdminTicketManagement() {
  const [tickets, setTickets] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyTicketId, setBusyTicketId] = useState("");
  const [error, setError] = useState("");
  const [actionModalTicketId, setActionModalTicketId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [ticketsData, techniciansData] = await Promise.all([
        fetchAllSupportTickets(),
        fetchTechnicians(),
      ]);
      setTickets(ticketsData);
      setTechnicians(techniciansData);
      
      const nextDrafts = {};
      ticketsData.forEach((ticket) => {
        nextDrafts[ticket.id] = {
          status: "",
          adminNote: ticket.adminNote || "",
          assignedTechnicianId: ticket.assignedTechnicianId || "",
        };
      });
      setDrafts(nextDrafts);
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const counts = useMemo(() => {
    const summary = { total: tickets.length, open: 0, inProgress: 0, resolved: 0, closed: 0, rejected: 0 };
    tickets.forEach((t) => {
      const s = (t.status || "").toLowerCase();
      if (s === "open") summary.open++;
      else if (s === "in progress") summary.inProgress++;
      else if (s === "resolved") summary.resolved++;
      else if (s === "closed") summary.closed++;
      else if (s === "rejected") summary.rejected++;
    });
    return summary;
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return tickets.filter(t => {
      const text = `${t.title} ${t.userName} ${t.ticketNumber} ${t.category}`.toLowerCase();
      if (searchTerm && !text.includes(q)) return false;
      if (statusFilter !== "ALL" && (t.status || "").toUpperCase().replace(/\s+/g, '_') !== statusFilter) return false;
      return true;
    });
  }, [tickets, searchTerm, statusFilter]);

  const pieData = useMemo(() => [
    { name: "Open", value: counts.open, color: "#F59E0B" },
    { name: "In Progress", value: counts.inProgress, color: "#3B82F6" },
    { name: "Resolved", value: counts.resolved, color: "#10B981" },
    { name: "Closed", value: counts.closed, color: "#64748B" },
    { name: "Rejected", value: counts.rejected, color: "#EF4444" },
  ].filter(d => d.value > 0), [counts]);

  const categoryData = useMemo(() => {
    const cats = {};
    tickets.forEach(t => { cats[t.category] = (cats[t.category] || 0) + 1; });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [tickets]);

  const handleChange = (ticketId, field, value) => {
    setDrafts(prev => ({ ...prev, [ticketId]: { ...prev[ticketId], [field]: value } }));
  };

  const handleSave = async (ticketId) => {
    try {
      setBusyTicketId(ticketId);
      setError("");
      const draft = drafts[ticketId] || {};
      const ticket = tickets.find(t => t.id === ticketId);
      
      if ((draft.assignedTechnicianId || "") !== (ticket.assignedTechnicianId || "")) {
        await assignSupportTechnician(ticketId, { technicianId: draft.assignedTechnicianId });
      }
      if (draft.status && draft.status !== ticket.status) {
        await updateSupportTicketStatus(ticketId, { status: draft.status, adminNote: draft.adminNote });
      }
      
      setActionModalTicketId("");
      await loadData();
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setBusyTicketId("");
    }
  };

  const selectedTicket = tickets.find(t => t.id === actionModalTicketId) || null;
  const selectedDraft = selectedTicket ? drafts[selectedTicket.id] || {} : {};

  const formatDuration = (totalSeconds) => {
    if (!totalSeconds || totalSeconds < 0) return "-";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <PortalLayout
      title="Ticket Management"
      subtitle="Operational hub for monitoring and resolving student support requests."
      pageClassName="admin-tickets-page"
    >
      <div className="admin-tickets-stack">
        <section className="admin-ticket-banner">
          <div className="admin-ticket-banner-top">
            <div className="admin-ticket-banner-copy">
              <span className="admin-ticket-kicker">Support Oversight</span>
              <h2>Administrative Ticket Queue</h2>
              <p>Assign technicians, monitor resolution times, and finalize student support requests from a single dashboard.</p>
            </div>
            <div className="admin-ticket-banner-actions">
              <button className="solid-btn" onClick={loadData}>Refresh Data</button>
              <button className="ghost-btn" onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); }}>Reset Filters</button>
            </div>
          </div>
          <div className="admin-ticket-chip-row">
            <span className="admin-ticket-chip"><strong>{tickets.length}</strong> Total Tickets</span>
            <span className="admin-ticket-chip"><strong>{technicians.length}</strong> Staff Available</span>
            <span className="admin-ticket-chip"><strong>{counts.open}</strong> New Requests</span>
          </div>
        </section>

        <section className="admin-ticket-stats-grid">
          <article className="admin-ticket-stat-card admin-ticket-stat-card-total"><h3>Total</h3><p className="metric-number">{counts.total}</p></article>
          <article className="admin-ticket-stat-card admin-ticket-stat-card-open"><h3>Open</h3><p className="metric-number">{counts.open}</p></article>
          <article className="admin-ticket-stat-card admin-ticket-stat-card-progress"><h3>In Progress</h3><p className="metric-number">{counts.inProgress}</p></article>
          <article className="admin-ticket-stat-card admin-ticket-stat-card-resolved"><h3>Resolved</h3><p className="metric-number">{counts.resolved}</p></article>
          <article className="admin-ticket-stat-card admin-ticket-stat-card-closed"><h3>Closed</h3><p className="metric-number">{counts.closed}</p></article>
          <article className="admin-ticket-stat-card admin-ticket-stat-card-rejected"><h3>Rejected</h3><p className="metric-number">{counts.rejected}</p></article>
        </section>

        <section className="admin-ticket-chart-board">
          <article className="admin-ticket-chart-card">
            <div className="admin-ticket-chart-head"><h4>Status Distribution</h4></div>
            <div className="admin-ticket-chart-body">
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
          <article className="admin-ticket-chart-card admin-ticket-chart-card-wide">
            <div className="admin-ticket-chart-head"><h4>Tickets by Category</h4></div>
            <div className="admin-ticket-chart-body">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData}>
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

        <section className="admin-ticket-panel">
          <div className="admin-booking-panel-head">
            <div>
              <h3>Support Queue</h3>
              <p>Manage workload and assignments across {filteredTickets.length} active filters.</p>
            </div>
            <div className="admin-booking-filter-bar">
              <label className="admin-booking-filter-field">Search<input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Student, title, number..." /></label>
              <label className="admin-booking-filter-field">Status
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="ALL">All Status</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </label>
            </div>
          </div>

          <div className="admin-ticket-table-wrap">
            <table className="admin-ticket-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Student</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Resolution</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map(t => (
                  <tr key={t.id} onClick={() => setActionModalTicketId(t.id)}>
                    <td><strong>{t.ticketNumber || t.id.slice(-6).toUpperCase()}</strong></td>
                    <td>
                      <div className="admin-booking-table-main">
                        <strong>{t.userName}</strong>
                        <span>{t.userEmail}</span>
                      </div>
                    </td>
                    <td><span className="admin-booking-table-meta">{t.category}</span></td>
                    <td>
                      <span className={`admin-ticket-status-badge admin-ticket-status-${(t.status || "").toLowerCase().replace(/\s+/g, '-')}`}>
                        {t.status}
                      </span>
                    </td>
                    <td><span className="admin-booking-table-meta">{formatDuration(t.timeToResolutionSeconds)}</span></td>
                    <td><span className="admin-booking-table-meta">{new Date(t.updatedAt).toLocaleDateString()}</span></td>
                    <td>
                      <button className="ghost-btn" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {selectedTicket && createPortal(
          <div className="admin-ticket-modal-overlay" onClick={e => e.target === e.currentTarget && setActionModalTicketId("")}>
            <aside className="admin-ticket-detail-modal">
              <div className="admin-booking-modal-head" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <p className="student-modern-section-label">Manage Ticket</p>
                  <h3>{selectedTicket.title}</h3>
                  <p className="helper-text">{selectedTicket.ticketNumber || selectedTicket.id}</p>
                </div>
                <button className="ghost-btn" onClick={() => setActionModalTicketId("")}>Close</button>
              </div>

              <div className="admin-booking-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '16px', marginBottom: '24px' }}>
                <div><label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Student</label><p><strong>{selectedTicket.userName}</strong></p></div>
                <div><label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Category</label><p><strong>{selectedTicket.category}</strong></p></div>
                <div><label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Current Status</label><p><strong>{selectedTicket.status}</strong></p></div>
                <div><label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Location</label><p><strong>{selectedTicket.locationResource || "N/A"}</strong></p></div>
              </div>

              <div className="admin-booking-decision-box" style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
                <SupportDropdown
                  label="Assign Technician"
                  value={selectedDraft.assignedTechnicianId || selectedTicket.assignedTechnicianId || ""}
                  onChange={v => handleChange(selectedTicket.id, "assignedTechnicianId", v)}
                  options={[{ value: "", label: "Unassigned" }, ...technicians.map(tech => ({ value: tech.id, label: tech.fullName || tech.email }))]}
                />
                <div style={{ marginTop: '16px' }}>
                  <SupportDropdown
                    label="Update Status"
                    value={selectedDraft.status || ""}
                    onChange={v => handleChange(selectedTicket.id, "status", v)}
                    options={[{ value: "", label: "No Change" }, { value: "Closed", label: "Closed" }, { value: "Rejected", label: "Rejected" }]}
                  />
                </div>
                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Admin Note</label>
                  <textarea
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '80px' }}
                    value={selectedDraft.adminNote || ""}
                    onChange={e => handleChange(selectedTicket.id, "adminNote", e.target.value)}
                    placeholder="Add a decision note..."
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="ghost-btn" onClick={() => setActionModalTicketId("")}>Cancel</button>
                <button className="solid-btn" onClick={() => handleSave(selectedTicket.id)} disabled={busyTicketId === selectedTicket.id}>
                  {busyTicketId === selectedTicket.id ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </aside>
          </div>,
          document.body
        )}
      </div>
    </PortalLayout>
  );
}

export default AdminTicketManagement;
