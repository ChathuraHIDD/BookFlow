import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

import PortalLayout from "../components/PortalLayout";
import { readApiError } from "../services/api";
import {
  assignSupportTechnician,
  fetchAllSupportTickets,
  fetchTechnicians,
  updateSupportTicketStatus,
} from "../services/support";

function AdminTicketManagement() {
  const [tickets, setTickets] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyTicketId, setBusyTicketId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const [ticketsData, techniciansData] = await Promise.all([
          fetchAllSupportTickets(),
          fetchTechnicians(),
        ]);
        if (!active) {
          return;
        }

        setTickets(ticketsData);
        setTechnicians(techniciansData);
        const nextDrafts = {};
        ticketsData.forEach((ticket) => {
          nextDrafts[ticket.id] = {
            status: ticket.status,
            adminNote: ticket.adminNote || "",
            assignedTechnicianId: ticket.assignedTechnicianId || "",
          };
        });
        setDrafts(nextDrafts);
      } catch (err) {
        if (active) {
          setError(readApiError(err));
          setTickets([]);
          setDrafts({});
          setTechnicians([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(() => {
    const summary = { total: tickets.length, open: 0, inProgress: 0, resolved: 0, closed: 0, rejected: 0 };
    tickets.forEach((ticket) => {
      if (ticket.status === "Open") {
        summary.open += 1;
      }
      if (ticket.status === "In Progress") {
        summary.inProgress += 1;
      }
      if (ticket.status === "Resolved") {
        summary.resolved += 1;
      }
      if (ticket.status === "Closed") {
        summary.closed += 1;
      }
      if (ticket.status === "Rejected") {
        summary.rejected += 1;
      }
    });
    return summary;
  }, [tickets]);

  const handleChange = (ticketId, field, value) => {
    setDrafts((current) => ({
      ...current,
      [ticketId]: {
        ...(current[ticketId] || {}),
        [field]: value,
      },
    }));
  };

  const handleSave = async (ticketId) => {
    try {
      setBusyTicketId(ticketId);
      setError("");
      const draft = drafts[ticketId] || {};
      if (draft.assignedTechnicianId) {
        await assignSupportTechnician(ticketId, { technicianId: draft.assignedTechnicianId });
      }
      const updated = await updateSupportTicketStatus(ticketId, {
        status: draft.status,
        adminNote: draft.adminNote,
      });

      setTickets((current) => current.map((ticket) => (ticket.id === ticketId ? updated : ticket)));
      setDrafts((current) => ({
        ...current,
        [ticketId]: {
          status: updated.status,
          adminNote: updated.adminNote || "",
            assignedTechnicianId: updated.assignedTechnicianId || "",
        },
      }));
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setBusyTicketId("");
    }
  };

  return (
    <PortalLayout
      title="Ticket Management"
      subtitle="Review all student support tickets and update their status from one place."
    >
      <section className="admin-vision-layout admin-user-vision-layout">
        <aside className="admin-vision-sidebar">
          <div className="admin-vision-brand">
            <img src="/nnic-logo-icon.png" alt="NNIC logo" className="admin-vision-brand-logo" />
          </div>
          <nav className="admin-vision-nav" aria-label="Admin quick menu">
            <NavLink to="/admin/profile" className="admin-vision-link">
              Dashboard
            </NavLink>
            <NavLink to="/admin/users" className="admin-vision-link">
              User Management
            </NavLink>
            <NavLink to="/admin/facilities" className="admin-vision-link">
              Resource Management
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
            {error ? <p className="error-text">{error}</p> : null}

            <div className="admin-section-head">
              <div>
                <p className="student-modern-section-label">Support Oversight</p>
                <h3 className="admin-section-title">Ticket Management Workspace</h3>
              </div>
            </div>

            <section className="stats-grid" style={{ marginTop: "18px" }}>
              <article className="metric-card">
                <h3>Total</h3>
                <p className="metric-number">{loading ? "--" : counts.total}</p>
                <p className="helper-text">All support tickets</p>
              </article>
              <article className="metric-card">
                <h3>Open</h3>
                <p className="metric-number">{loading ? "--" : counts.open}</p>
                <p className="helper-text">Waiting for response</p>
              </article>
              <article className="metric-card">
                <h3>In Progress</h3>
                <p className="metric-number">{loading ? "--" : counts.inProgress}</p>
                <p className="helper-text">Actively handled</p>
              </article>
              <article className="metric-card">
                <h3>Resolved</h3>
                <p className="metric-number">{loading ? "--" : counts.resolved}</p>
                <p className="helper-text">Closed by the team</p>
              </article>
              <article className="metric-card">
                <h3>Closed</h3>
                <p className="metric-number">{loading ? "--" : counts.closed}</p>
                <p className="helper-text">Finalized by admin</p>
              </article>
              <article className="metric-card">
                <h3>Rejected</h3>
                <p className="metric-number">{loading ? "--" : counts.rejected}</p>
                <p className="helper-text">Rejected by admin</p>
              </article>
            </section>

            {loading ? <p className="helper-text" style={{ marginTop: "12px" }}>Loading tickets...</p> : null}

            <div className="table-wrap" style={{ marginTop: "18px" }}>
              <table>
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Student</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => {
                    const draft = drafts[ticket.id] || {};
                    const statusKey = (ticket.status || "").toLowerCase().replace(/\s+/g, "-");

                    return (
                      <tr key={ticket.id}>
                        <td>{ticket.ticketNumber || ticket.id}</td>
                        <td>
                          <strong>{ticket.userName}</strong>
                          <p className="helper-text">{ticket.userEmail}</p>
                        </td>
                        <td>{ticket.title}</td>
                        <td>{ticket.category}</td>
                        <td>
                          <span className={`status-badge support-status-badge ${statusKey}`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td>{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : "-"}</td>
                        <td>
                          <div className="admin-ticket-actions">
                            <select
                              value={draft.assignedTechnicianId || ticket.assignedTechnicianId || ""}
                              onChange={(event) => handleChange(ticket.id, "assignedTechnicianId", event.target.value)}
                            >
                              <option value="">Unassigned</option>
                              {technicians.map((technician) => (
                                <option key={technician.id} value={technician.id}>
                                  {technician.fullName || technician.email}
                                </option>
                              ))}
                            </select>
                            <select
                              value={draft.status || ticket.status}
                              onChange={(event) => handleChange(ticket.id, "status", event.target.value)}
                            >
                              <option>Open</option>
                              <option>In Progress</option>
                              <option>Resolved</option>
                              <option>Closed</option>
                              <option>Rejected</option>
                            </select>
                            <input
                              type="text"
                              value={draft.adminNote || ""}
                              onChange={(event) => handleChange(ticket.id, "adminNote", event.target.value)}
                              placeholder="Admin note"
                            />
                            <button
                              className="ghost-btn"
                              type="button"
                              disabled={busyTicketId === ticket.id}
                              onClick={() => handleSave(ticket.id)}
                            >
                              {busyTicketId === ticket.id ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </PortalLayout>
  );
}

export default AdminTicketManagement;
