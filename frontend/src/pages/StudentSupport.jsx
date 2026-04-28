import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { fetchMySupportTickets } from "../services/support";
import "./StudentSupport.css";

function StudentSupport() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchText, setSearchText] = useState("");

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchMySupportTickets();
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
      const searchable = `${t.ticketNumber} ${t.title} ${t.category} ${t.status} ${t.locationResource}`.toLowerCase();
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

  return (
    <PortalLayout
      title="Support Center"
      subtitle="Comprehensive tracking and management hub for all your campus support requests."
      pageClassName="student-support-page"
    >
      <div className="student-support-stack">
        <section className="student-support-banner">
          <div className="student-support-banner-top">
            <div className="student-support-banner-copy">
              <span className="student-support-kicker">Student Services</span>
              <h2>How can we help today?</h2>
              <p>Track your active incident reports, review previous resolutions, or raise a new support request for campus facilities or IT issues.</p>
            </div>
            <div className="student-support-banner-actions">
              <Link className="solid-btn" to="/student/support/raise">Raise New Ticket</Link>
              <button className="ghost-btn" onClick={loadTickets}>Refresh Queue</button>
            </div>
          </div>
          <div className="admin-booking-chip-row">
            <span className="admin-booking-chip"><strong>{tickets.length}</strong> Total Tickets</span>
            <span className="admin-booking-chip"><strong>{counts.inProgress}</strong> Currently Active</span>
            <span className="admin-booking-chip"><strong>{counts.resolved}</strong> Completed</span>
          </div>
        </section>

        <section className="student-support-stats-grid">
          <article className="student-support-stat-card student-support-stat-card-total"><h3>Total</h3><p className="metric-number">{counts.total}</p></article>
          <article className="student-support-stat-card student-support-stat-card-open"><h3>Open</h3><p className="metric-number">{counts.open}</p></article>
          <article className="student-support-stat-card student-support-stat-card-progress"><h3>In Progress</h3><p className="metric-number">{counts.inProgress}</p></article>
          <article className="student-support-stat-card student-support-stat-card-resolved"><h3>Resolved</h3><p className="metric-number">{counts.resolved}</p></article>
        </section>

        <section className="student-support-chart-board">
          <article className="student-support-chart-card">
            <div className="student-support-chart-head"><h4>Ticket Status</h4></div>
            <div className="student-support-chart-body">
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={5}>
                    {pieData.map(d => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>
          <article className="student-support-chart-card student-support-chart-card-wide">
            <div className="student-support-chart-head"><h4>Requests by Type</h4></div>
            <div className="student-support-chart-body">
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <section className="student-support-panel">
          <div className="admin-booking-panel-head">
            <div>
              <h3>My Support Queue</h3>
              <p>Review the status of your {visibleTickets.length} visible support requests.</p>
            </div>
            <div className="admin-booking-filter-bar">
              <label className="admin-booking-filter-field">Search<input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Search title, category..." /></label>
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

          <div className="student-support-table-wrap">
            <table className="student-support-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Subject & Location</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Last Update</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleTickets.map(t => (
                  <tr key={t.id} onClick={() => navigate(`/student/support/${t.id}`)}>
                    <td><strong>{t.ticketNumber || t.id.slice(-6).toUpperCase()}</strong></td>
                    <td>
                      <div className="admin-booking-table-main">
                        <strong>{t.title}</strong>
                        <span>{t.locationResource || "General Campus"}</span>
                      </div>
                    </td>
                    <td><span className="admin-booking-table-meta">{t.category}</span></td>
                    <td>
                      <span className={`student-support-status-badge student-support-status-${(t.status || "").toLowerCase().replace(/\s+/g, '-')}`}>
                        {t.status}
                      </span>
                    </td>
                    <td><span className="admin-booking-table-meta">{t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : "-"}</span></td>
                    <td>
                      <button className="ghost-btn" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>View Ticket</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {visibleTickets.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p className="helper-text">No support tickets found matching your search.</p>
              <Link to="/student/support/raise" className="solid-btn" style={{ marginTop: '16px', display: 'inline-block' }}>Raise New Ticket</Link>
            </div>
          )}
        </section>
      </div>
    </PortalLayout>
  );
}

export default StudentSupport;
