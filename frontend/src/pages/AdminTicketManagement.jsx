import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";

import PortalLayout from "../components/PortalLayout";
import SupportDropdown from "../components/SupportDropdown";
import { readApiError } from "../services/api";
import {
  assignSupportTechnician,
  fetchAllSupportTickets,
  fetchTechnicians,
  updateSupportTicketStatus,
} from "../services/support";
import "./SupportModule.css";

function AdminTicketManagement() {
  const [tickets, setTickets] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyTicketId, setBusyTicketId] = useState("");
  const [error, setError] = useState("");
  const [actionModalTicketId, setActionModalTicketId] = useState("");

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
            status: "",
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

  useEffect(() => {
    if (!actionModalTicketId) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [actionModalTicketId]);

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
      const ticket = tickets.find((item) => item.id === ticketId);
      if (!ticket) {
        throw new Error("Ticket not found");
      }

      const assignmentChanged =
        (draft.assignedTechnicianId || "") !== (ticket.assignedTechnicianId || "");
      const statusChanged = Boolean(draft.status && draft.status !== ticket.status);

      if (!assignmentChanged && !statusChanged) {
        setError("No changes to save.");
        return;
      }

      if (assignmentChanged && draft.assignedTechnicianId) {
        await assignSupportTechnician(ticketId, { technicianId: draft.assignedTechnicianId });
      }

      let updated = ticket;
      if (statusChanged) {
        updated = await updateSupportTicketStatus(ticketId, {
          status: draft.status,
          adminNote: draft.adminNote,
        });
      } else if (assignmentChanged) {
        const refreshed = await fetchAllSupportTickets();
        const latest = refreshed.find((item) => item.id === ticketId);
        updated = latest || ticket;
      }

      setTickets((current) => current.map((ticket) => (ticket.id === ticketId ? updated : ticket)));
      setDrafts((current) => ({
        ...current,
        [ticketId]: {
          status: "",
          adminNote: updated.adminNote || "",
          assignedTechnicianId: updated.assignedTechnicianId || "",
        },
      }));
      if (actionModalTicketId === ticketId) {
        setActionModalTicketId("");
      }
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setBusyTicketId("");
    }
  };

  const selectedTicket = tickets.find((ticket) => ticket.id === actionModalTicketId) || null;
  const selectedDraft = selectedTicket ? drafts[selectedTicket.id] || {} : {};
  const formatUpdatedDateTime = (value) => {
    if (!value) {
      return { date: "-", time: "" };
    }

    const date = new Date(value);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    };
  };

  return (
    <PortalLayout
      title="Ticket Management"
      subtitle="Review all student support tickets and update their status from one place."
      pageClassName="support-module-page"
      heroClassName="support-module-hero support-module-hero-detail"
      contentCardClassName="support-module-surface"
    >
      <section className="admin-user-panel support-admin-panel">
        {error ? <p className="support-inline-alert error-text">{error}</p> : null}

        <div className="admin-section-head">
          <div>
            <p className="student-modern-section-label">Support Oversight</p>
            <h3 className="admin-section-title">Ticket Management Workspace</h3>
          </div>
        </div>

        <section className="support-overview-band support-admin-overview">
          <div className="support-overview-copy">
            <span className="support-eyebrow">Admin Control</span>
            <h3>Review workload, assign technicians, and close the loop on support requests.</h3>
            <p>
              This workspace gives you a single queue for assignment decisions, final approval,
              and rejection notes when tickets need administrative action.
            </p>
          </div>
          <div className="support-overview-meta">
            <div className="support-overview-chip">
              <strong>{loading ? "--" : technicians.length}</strong>
              <span>assignable staff available</span>
            </div>
            <div className="support-overview-chip">
              <strong>{loading ? "--" : counts.open + counts.inProgress}</strong>
              <span>tickets still in motion</span>
            </div>
          </div>
        </section>

        <section className="stats-grid support-stats-grid support-admin-stats-grid">
          <article className="metric-card support-metric-card support-metric-total">
            <h3>Total</h3>
            <p className="metric-number">{loading ? "--" : counts.total}</p>
            <p className="helper-text">All support tickets</p>
          </article>
          <article className="metric-card support-metric-card support-metric-open">
            <h3>Open</h3>
            <p className="metric-number">{loading ? "--" : counts.open}</p>
            <p className="helper-text">Awaiting assignee action</p>
          </article>
          <article className="metric-card support-metric-card support-metric-progress">
            <h3>In Progress</h3>
            <p className="metric-number">{loading ? "--" : counts.inProgress}</p>
            <p className="helper-text">Being handled by assignee</p>
          </article>
          <article className="metric-card support-metric-card support-metric-resolved">
            <h3>Resolved</h3>
            <p className="metric-number">{loading ? "--" : counts.resolved}</p>
            <p className="helper-text">Resolved by assignee</p>
          </article>
          <article className="metric-card support-metric-card support-metric-closed">
            <h3>Closed</h3>
            <p className="metric-number">{loading ? "--" : counts.closed}</p>
            <p className="helper-text">Finalized by admin</p>
          </article>
          <article className="metric-card support-metric-card support-metric-rejected">
            <h3>Rejected</h3>
            <p className="metric-number">{loading ? "--" : counts.rejected}</p>
            <p className="helper-text">Rejected by admin</p>
          </article>
        </section>

        {loading ? <p className="helper-text">Loading tickets...</p> : null}

        <div className="table-wrap support-ticket-table-wrap support-admin-table-wrap support-admin-table-gap">
          <table className="support-ticket-table support-admin-ticket-table">
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
                const statusKey = (ticket.status || "").toLowerCase().replace(/\s+/g, "-");
                const updated = formatUpdatedDateTime(ticket.updatedAt);

                return (
                  <tr key={ticket.id}>
                    <td className="support-ticket-table-id">{ticket.ticketNumber || ticket.id}</td>
                    <td>
                      <div className="support-ticket-table-subject">
                        <strong>{ticket.userName}</strong>
                        <span className="helper-text">{ticket.userEmail}</span>
                      </div>
                    </td>
                    <td>
                      <div className="support-ticket-table-subject">
                        <strong>{ticket.title}</strong>
                        <span className="helper-text">{ticket.locationResource || "General request"}</span>
                      </div>
                    </td>
                    <td>{ticket.category}</td>
                    <td>
                      <span className={`status-badge support-status-badge ${statusKey}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td>
                      <div className="support-admin-datetime">
                        <span>{updated.date}</span>
                        {updated.time ? <span>{updated.time}</span> : null}
                      </div>
                    </td>
                    <td>
                      <div className="admin-ticket-actions support-admin-actions">
                        <button
                          className="ghost-btn support-table-action"
                          type="button"
                          onClick={() => {
                            setError("");
                            setActionModalTicketId(ticket.id);
                          }}
                        >
                          Manage Ticket
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {selectedTicket
          ? createPortal(
              <div
                className="support-modal-backdrop"
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-ticket-modal-title"
                onClick={() => {
                  if (busyTicketId !== selectedTicket.id) {
                    setActionModalTicketId("");
                  }
                }}
              >
                <div className="support-modal-card support-admin-ticket-modal" onClick={(event) => event.stopPropagation()}>
                  <button
                    className="support-modal-close"
                    type="button"
                    aria-label="Close ticket management dialog"
                    onClick={() => setActionModalTicketId("")}
                    disabled={busyTicketId === selectedTicket.id}
                  >
                    X
                  </button>
                  <h4 id="admin-ticket-modal-title">Manage Ticket</h4>
                  <p className="helper-text">
                    {selectedTicket.ticketNumber || selectedTicket.id} · {selectedTicket.title}
                  </p>

                  <div className="support-admin-ticket-modal-meta">
                    <span className={`status-badge support-status-badge ${(selectedTicket.status || "").toLowerCase().replace(/\s+/g, "-")}`}>
                      {selectedTicket.status}
                    </span>
                    <span className="support-admin-ticket-modal-chip">{selectedTicket.userName}</span>
                  </div>

                  <div className="support-admin-action-card support-admin-action-card-modal">
                    <SupportDropdown
                      id="admin-ticket-technician"
                      label="Assign Technician / Staff"
                      value={selectedDraft.assignedTechnicianId || selectedTicket.assignedTechnicianId || ""}
                      onChange={(value) => handleChange(selectedTicket.id, "assignedTechnicianId", value)}
                      options={[
                        { value: "", label: "Unassigned" },
                        ...technicians.map((technician) => ({
                          value: technician.id,
                          label: technician.fullName || technician.email,
                        })),
                      ]}
                    />

                    <SupportDropdown
                      id="admin-ticket-status"
                      label="Update Status"
                      value={selectedDraft.status || ""}
                      onChange={(value) => handleChange(selectedTicket.id, "status", value)}
                      options={[
                        { value: "", label: "No status change" },
                        { value: "Closed", label: "Closed" },
                        { value: "Rejected", label: "Rejected" },
                      ]}
                    />

                    <label className="support-admin-action-field">
                      <span>Admin Note</span>
                      <input
                        type="text"
                        value={selectedDraft.adminNote || ""}
                        onChange={(event) => handleChange(selectedTicket.id, "adminNote", event.target.value)}
                        placeholder="Add decision note"
                      />
                    </label>
                  </div>

                  <div className="support-modal-actions">
                    <button
                      className="ghost-btn"
                      type="button"
                      disabled={busyTicketId === selectedTicket.id}
                      onClick={() => setActionModalTicketId("")}
                    >
                      Cancel
                    </button>
                    <button
                      className="solid-btn support-admin-save-btn"
                      type="button"
                      disabled={busyTicketId === selectedTicket.id}
                      onClick={() => handleSave(selectedTicket.id)}
                    >
                      {busyTicketId === selectedTicket.id ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )
          : null}
      </section>
    </PortalLayout>
  );
}

export default AdminTicketManagement;
