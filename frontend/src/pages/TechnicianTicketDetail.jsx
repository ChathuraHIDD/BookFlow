import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import PortalLayout from "../components/PortalLayout";
import { readApiError } from "../services/api";
import {
  addSupportTicketComment,
  downloadSupportAttachment,
  fetchTechnicianSupportTicket,
  updateTechnicianSupportTicket,
} from "../services/support";

function TechnicianTicketDetail() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [status, setStatus] = useState("In Progress");
  const [resolutionNote, setResolutionNote] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [updatePanelOpen, setUpdatePanelOpen] = useState(false);
  const [commentPanelOpen, setCommentPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchTechnicianSupportTicket(ticketId);
        if (!active) {
          return;
        }
        setTicket(data);
        setStatus(data.status === "Resolved" ? "Resolved" : "In Progress");
        setResolutionNote("");
        setCommentDraft("");
        setUpdatePanelOpen(false);
        setCommentPanelOpen(false);
      } catch (err) {
        if (active) {
          setError(readApiError(err));
          setTicket(null);
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
  }, [ticketId]);

  const handleSave = async () => {
    if (!ticket) {
      return;
    }
    try {
      setBusy(true);
      setError("");
      const updated = await updateTechnicianSupportTicket(ticket.id, {
        status,
        resolutionNote,
      });
      setTicket(updated);
      setStatus(updated.status === "Resolved" ? "Resolved" : "In Progress");
      setResolutionNote("");
      setUpdatePanelOpen(false);
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCommentSave = async () => {
    if (!ticket) {
      return;
    }
    const message = commentDraft.trim();
    if (!message) {
      setError("Comment message is required.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      const updated = await addSupportTicketComment(ticket.id, { message });
      setTicket(updated);
      setStatus(updated.status === "Resolved" ? "Resolved" : "In Progress");
      setResolutionNote("");
      setCommentDraft("");
      setCommentPanelOpen(false);
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleAttachmentOpen = async (attachment) => {
    try {
      setBusy(true);
      setError("");
      const { blob, fileName } = await downloadSupportAttachment(ticket.id, attachment.id);
      const objectUrl = URL.createObjectURL(blob);
      const newWindow = window.open(objectUrl, "_blank", "noreferrer");
      if (!newWindow) {
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      }
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PortalLayout
      title="Technician Ticket Details"
      subtitle="Review ticket information and submit updates from this dedicated page."
    >
      <div className="cta-row" style={{ marginBottom: "14px" }}>
        <Link className="ghost-btn" to="/technician/tickets">
          Back to Ticket List
        </Link>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p className="helper-text">Loading ticket...</p> : null}

      {!loading && !ticket ? (
        <article className="metric-card">
          <h3>Ticket not found</h3>
          <p className="helper-text">This ticket may no longer be assigned to you.</p>
          <button className="ghost-btn" type="button" onClick={() => navigate("/technician/tickets")}>Go Back</button>
        </article>
      ) : null}

      {ticket ? (
        <article className="metric-card support-ticket-detail-card" style={{ marginTop: "8px" }}>
          <div className="support-ticket-detail-head">
            <div>
              <p className="helper-text">{ticket.ticketNumber || ticket.id}</p>
              <h3>{ticket.title}</h3>
            </div>
            <span className={`status-badge support-status-badge ${(ticket.status || "").toLowerCase().replace(/\s+/g, "-")}`}>
              {ticket.status}
            </span>
          </div>

          <div className="support-ticket-detail-grid">
            <p><strong>Category:</strong> {ticket.category}</p>
            <p><strong>Priority:</strong> {ticket.priority}</p>
            <p><strong>Location / Resource:</strong> {ticket.locationResource}</p>
            <p><strong>Student:</strong> {ticket.userName}</p>
            <p><strong>Contact:</strong> {ticket.contactDetails}</p>
            <p><strong>Assigned:</strong> {ticket.assignedTechnicianName || "Unassigned"}</p>
          </div>

          <div className="support-ticket-detail-section">
            <h4>Description</h4>
            <p>{ticket.description}</p>
          </div>

          {ticket.resolutionNote ? (
            <div className="support-ticket-detail-section">
              <h4>Resolution Note</h4>
              <p>{ticket.resolutionNote}</p>
            </div>
          ) : null}

          {ticket.comments?.length ? (
            <div className="support-ticket-detail-section">
              <h4>Comments</h4>
              <div className="support-ticket-comment-list">
                {ticket.comments.map((comment) => (
                  <article key={comment.id} className="support-ticket-comment-item">
                    <strong>{comment.authorName}</strong>
                    <p className="helper-text">{comment.authorRole} · {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ""}</p>
                    <p>{comment.message}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {ticket.attachments?.length ? (
            <div className="support-ticket-detail-section">
              <h4>Attachments</h4>
              <ul className="support-ticket-attachment-list">
                {ticket.attachments.map((attachment) => (
                  <li key={attachment.id}>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => handleAttachmentOpen(attachment)}
                      aria-label={`Download ${attachment.originalFileName}`}
                      title={`Download ${attachment.originalFileName}`}
                    >
                      Download {attachment.originalFileName}
                    </button>
                    <span className="helper-text">
                      {attachment.uploadedByName} · {attachment.createdAt ? new Date(attachment.createdAt).toLocaleString() : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="support-ticket-detail-section">
            <button
              type="button"
              className="solid-btn"
              onClick={() => setUpdatePanelOpen((current) => !current)}
            >
              {updatePanelOpen ? "Close Update Ticket" : "Update Ticket"}
            </button>
            {updatePanelOpen ? (
              <div className="admin-ticket-actions" style={{ alignItems: "stretch", marginTop: "12px" }}>
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
                <textarea
                  value={resolutionNote}
                  onChange={(event) => setResolutionNote(event.target.value)}
                  placeholder="Add a resolution note"
                  rows="4"
                />
                <button className="solid-btn" type="button" disabled={busy} onClick={handleSave}>
                  {busy ? "Saving..." : "Save Update"}
                </button>
              </div>
            ) : null}
          </div>

          <div className="support-ticket-detail-section">
            <button
              type="button"
              className="solid-btn"
              onClick={() => setCommentPanelOpen((current) => !current)}
            >
              {commentPanelOpen ? "Close Technician Update" : "Add Technician Update"}
            </button>
            {commentPanelOpen ? (
              <div className="admin-ticket-actions" style={{ alignItems: "stretch", marginTop: "12px" }}>
                <textarea
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="Add a progress update or note for the student"
                  rows="3"
                />
                <button className="solid-btn" type="button" disabled={busy} onClick={handleCommentSave}>
                  {busy ? "Posting..." : "Post Update"}
                </button>
              </div>
            ) : null}
          </div>
        </article>
      ) : null}
    </PortalLayout>
  );
}

export default TechnicianTicketDetail;
