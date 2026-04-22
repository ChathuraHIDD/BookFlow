import { useEffect, useMemo, useState } from "react";

import PortalLayout from "../components/PortalLayout";
import { readApiError } from "../services/api";
import { fetchTechnicianSupportTickets, updateTechnicianSupportTicket } from "../services/support";

function TechnicianTicketManagement() {
  const [tickets, setTickets] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyTicketId, setBusyTicketId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchTechnicianSupportTickets();
        if (!active) {
          return;
        }

        setTickets(data);
        const nextDrafts = {};
        data.forEach((ticket) => {
          nextDrafts[ticket.id] = {
            status: ticket.status,
            resolutionNote: ticket.resolutionNote || "",
          };
        });
        setDrafts(nextDrafts);
        setSelectedTicketId((current) => current || (data.length ? data[0].id : ""));
      } catch (err) {
        if (active) {
          setError(readApiError(err));
          setTickets([]);
          setDrafts({});
          setSelectedTicketId("");
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
    const summary = { total: tickets.length, open: 0, inProgress: 0, resolved: 0 };
    tickets.forEach((ticket) => {
      if (ticket.status === "Open") summary.open += 1;
      if (ticket.status === "In Progress") summary.inProgress += 1;
      if (ticket.status === "Resolved") summary.resolved += 1;
    });
    return summary;
  }, [tickets]);

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) || null;
  const selectedDraft = selectedTicket ? drafts[selectedTicket.id] || {} : {};

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
      const updated = await updateTechnicianSupportTicket(ticketId, {
        status: draft.status,
        resolutionNote: draft.resolutionNote,
      });

      setTickets((current) => current.map((ticket) => (ticket.id === ticketId ? updated : ticket)));
      setDrafts((current) => ({
        ...current,
        [ticketId]: {
          status: updated.status,
          resolutionNote: updated.resolutionNote || "",
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
      title="Technician Ticket Workspace"
      subtitle="Handle tickets assigned to you, move them through the support lifecycle, and leave resolution notes."
    >
      {error ? <p className="error-text">{error}</p> : null}

      <section className="stats-grid">
        <article className="metric-card">
          <h3>Total</h3>
          <p className="metric-number">{loading ? "--" : counts.total}</p>
          <p className="helper-text">Assigned tickets</p>
        </article>
        <article className="metric-card">
          <h3>Open</h3>
          <p className="metric-number">{loading ? "--" : counts.open}</p>
          <p className="helper-text">Waiting to start</p>
        </article>
        <article className="metric-card">
          <h3>In Progress</h3>
          <p className="metric-number">{loading ? "--" : counts.inProgress}</p>
          <p className="helper-text">Currently being worked on</p>
        </article>
        <article className="metric-card">
          <h3>Resolved</h3>
          <p className="metric-number">{loading ? "--" : counts.resolved}</p>
          <p className="helper-text">Marked complete</p>
        </article>
      </section>

      {loading ? <p className="helper-text" style={{ marginTop: "12px" }}>Loading assigned tickets...</p> : null}

      <div className="table-wrap" style={{ marginTop: "18px" }}>
        <table>
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Student</th>
              <th>Title</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Action</th>
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
                  <td>
                    <span className={`status-badge support-status-badge ${statusKey}`}>{ticket.status}</span>
                  </td>
                  <td>{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : "-"}</td>
                  <td>
                    <button className="ghost-btn" type="button" onClick={() => setSelectedTicketId(ticket.id)}>
                      View / Update
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedTicket ? (
        <article className="metric-card support-ticket-detail-card" style={{ marginTop: "18px" }}>
          <div className="support-ticket-detail-head">
            <div>
              <p className="helper-text">{selectedTicket.ticketNumber || selectedTicket.id}</p>
              <h3>{selectedTicket.title}</h3>
            </div>
            <span className={`status-badge support-status-badge ${(selectedTicket.status || "").toLowerCase().replace(/\s+/g, "-")}`}>
              {selectedTicket.status}
            </span>
          </div>

          <div className="support-ticket-detail-grid">
            <p><strong>Category:</strong> {selectedTicket.category}</p>
            <p><strong>Priority:</strong> {selectedTicket.priority}</p>
            <p><strong>Location / Resource:</strong> {selectedTicket.locationResource}</p>
            <p><strong>Student:</strong> {selectedTicket.userName}</p>
            <p><strong>Contact:</strong> {selectedTicket.contactDetails}</p>
            <p><strong>Assigned:</strong> {selectedTicket.assignedTechnicianName || "Unassigned"}</p>
          </div>

          <div className="support-ticket-detail-section">
            <h4>Description</h4>
            <p>{selectedTicket.description}</p>
          </div>

          {selectedTicket.resolutionNote ? (
            <div className="support-ticket-detail-section">
              <h4>Resolution Note</h4>
              <p>{selectedTicket.resolutionNote}</p>
            </div>
          ) : null}

          {selectedTicket.comments?.length ? (
            <div className="support-ticket-detail-section">
              <h4>Comments</h4>
              <div className="support-ticket-comment-list">
                {selectedTicket.comments.map((comment) => (
                  <article key={comment.id} className="support-ticket-comment-item">
                    <strong>{comment.authorName}</strong>
                    <p className="helper-text">{comment.authorRole} · {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ""}</p>
                    <p>{comment.message}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {selectedTicket.attachments?.length ? (
            <div className="support-ticket-detail-section">
              <h4>Attachments</h4>
              <ul className="support-ticket-attachment-list">
                {selectedTicket.attachments.map((attachment) => (
                  <li key={attachment.id}>
                    <a href={attachment.downloadUrl} target="_blank" rel="noreferrer">
                      {attachment.originalFileName}
                    </a>
                    <span className="helper-text">
                      {attachment.uploadedByName} · {attachment.createdAt ? new Date(attachment.createdAt).toLocaleString() : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="support-ticket-detail-section">
            <h4>Update Ticket</h4>
            <div className="admin-ticket-actions" style={{ alignItems: "stretch" }}>
              <select
                value={selectedDraft.status || selectedTicket.status}
                onChange={(event) => handleChange(selectedTicket.id, "status", event.target.value)}
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
              <textarea
                value={selectedDraft.resolutionNote || ""}
                onChange={(event) => handleChange(selectedTicket.id, "resolutionNote", event.target.value)}
                placeholder="Add a resolution note"
                rows="4"
              />
              <button
                className="solid-btn"
                type="button"
                disabled={busyTicketId === selectedTicket.id}
                onClick={() => handleSave(selectedTicket.id)}
              >
                {busyTicketId === selectedTicket.id ? "Saving..." : "Save Update"}
              </button>
            </div>
          </div>
        </article>
      ) : null}

      {!loading && !tickets.length ? (
        <article className="metric-card" style={{ marginTop: "18px" }}>
          <h3>No assigned tickets</h3>
          <p className="helper-text">You currently do not have any tickets assigned.</p>
        </article>
      ) : null}
    </PortalLayout>
  );
}

export default TechnicianTicketManagement;
