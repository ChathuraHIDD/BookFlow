import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import { fetchTechnicianSupportTickets } from "../services/support";
import "./TechnicianTicketManagement.css";

function TechnicianTicketManagement() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchText, setSearchText] = useState("");

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchTechnicianSupportTickets();
      setTickets(data);
    } catch (err) {
      setError(readApiError(err));
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const counts = useMemo(() => {
    const summary = { total: tickets.length, open: 0, inProgress: 0, resolved: 0 };
    tickets.forEach((t) => {
      const s = (t.status || "").toLowerCase();
      if (s === "open") summary.open++;
      else if (s === "in progress") summary.inProgress++;
      else if (s === "resolved") summary.resolved++;
    });
    return summary;
  }, [tickets]);

  const visibleTickets = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (!q) return true;
      const searchable = `${t.ticketNumber} ${t.userName} ${t.userEmail} ${t.title} ${t.category} ${t.status}`.toLowerCase();
      return searchable.includes(q);
    });
  }, [tickets, statusFilter, searchText]);

  const pieData = useMemo(() => [
    { name: "Open", value: counts.open, color: "#F59E0B" },
    { name: "In Progress", value: counts.inProgress, color: "#3B82F6" },
    { name: "Resolved", value: counts.resolved, color: "#10B981" },
  ].filter(d => d.value > 0), [counts]);

  const categoryData = useMemo(() => {
    const cats = {};
    tickets.forEach(t => { cats[t.category] = (cats[t.category] || 0) + 1; });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [tickets]);

  const formatDuration = (totalSeconds) => {
    if (!totalSeconds || totalSeconds < 0) return "-";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatUpdatedDateTime = (value) => {
    if (!value) return { date: "-", time: "" };
    const date = new Date(value);
    return { date: date.toLocaleDateString(), time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
  };

  return (
    <PortalLayout
      title="Technician Workspace"
      subtitle="Operational dashboard for managing and resolving assigned student support tickets."
      pageClassName="technician-tickets-page"
    >
      <div className="technician-tickets-stack">
        <section className="technician-ticket-banner">
          <div className="technician-ticket-banner-top">
            <div className="technician-ticket-banner-copy">
              <span className="technician-ticket-kicker">Operational Hub</span>
              <h2>My Ticket Queue</h2>
              <p>Review assigned student requests, provide technical updates, and manage your resolution workload efficiently.</p>
            </div>
            <div className="technician-ticket-banner-actions">
              <button className="solid-btn" onClick={loadTickets}>Refresh Queue</button>
              <button className="ghost-btn" onClick={() => { setSearchText(""); setStatusFilter("ALL"); }}>Clear Filters</button>
            </div>
          </div>
          <div className="technician-ticket-chip-row">
            <span className="technician-ticket-chip"><strong>{tickets.length}</strong> Total Assigned</span>
            <span className="technician-ticket-chip"><strong>{counts.inProgress}</strong> Active Now</span>
            <span className="technician-ticket-chip"><strong>{counts.open}</strong> Awaiting Action</span>
          </div>
        </section>

        <section className="technician-ticket-stats-grid">
          <article className="technician-ticket-stat-card technician-ticket-stat-card-total"><h3>Total</h3><p className="metric-number">{counts.total}</p></article>
          <article className="technician-ticket-stat-card technician-ticket-stat-card-open"><h3>Open</h3><p className="metric-number">{counts.open}</p></article>
          <article className="technician-ticket-stat-card technician-ticket-stat-card-progress"><h3>In Progress</h3><p className="metric-number">{counts.inProgress}</p></article>
          <article className="technician-ticket-stat-card technician-ticket-stat-card-resolved"><h3>Resolved</h3><p className="metric-number">{counts.resolved}</p></article>
        </section>

        <section className="technician-ticket-chart-board">
          <article className="technician-ticket-chart-card">
            <div className="technician-ticket-chart-head"><h4>Workload Status</h4></div>
            <div className="technician-ticket-chart-body">
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
          <article className="technician-ticket-chart-card technician-ticket-chart-card-wide">
            <div className="technician-ticket-chart-head"><h4>Tickets by Category</h4></div>
            <div className="technician-ticket-chart-body">
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

        <section className="technician-ticket-panel">
          <div className="admin-booking-panel-head">
            <div>
              <h3>Active Queue</h3>
              <p>Showing {visibleTickets.length} of {tickets.length} tickets assigned to you.</p>
            </div>
            <div className="admin-booking-filter-bar">
              <label className="admin-booking-filter-field">Search<input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Student, title, number..." /></label>
              <label className="admin-booking-filter-field">Status
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="ALL">All Status</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </label>
            </div>
          </div>

          <div className="technician-ticket-table-wrap">
            <table className="technician-ticket-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Student</th>
                  <th>Title & Category</th>
                  <th>Status</th>
                  <th>Resolution</th>
                  <th>Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleTickets.map(t => {
                  const updated = formatUpdatedDateTime(t.updatedAt);
                  return (
                    <tr key={t.id}>
                      <td><strong>{t.ticketNumber || t.id.slice(-6).toUpperCase()}</strong></td>
                      <td>
                        <div className="admin-booking-table-main">
                          <strong>{t.userName}</strong>
                          <span>{t.userEmail}</span>
                        </div>
                      </td>
                      <td>
                        <div className="admin-booking-table-main">
                          <strong>{t.title}</strong>
                          <span>{t.category}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`technician-ticket-status-badge technician-ticket-status-${(t.status || "").toLowerCase().replace(/\s+/g, '-')}`}>
                          {t.status}
                        </span>
                      </td>
                      <td><span className="admin-booking-table-meta">{formatDuration(t.timeToResolutionSeconds)}</span></td>
                      <td>
                        <div className="admin-booking-table-main">
                          <strong>{updated.date}</strong>
                          <span>{updated.time}</span>
                        </div>
                      </td>
                      <td>
                        <Link className="ghost-btn" style={{ padding: '6px 14px', fontSize: '0.85rem' }} to={`/technician/tickets/${t.id}`}>Open Ticket</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PortalLayout>
  );
}

export default TechnicianTicketManagement;
