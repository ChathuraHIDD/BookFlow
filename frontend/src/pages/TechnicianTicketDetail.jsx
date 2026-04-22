import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/useAuth";
import { readApiError } from "../services/api";
import {
  addSupportTicketComment,
  deleteSupportTicketComment,
  downloadSupportAttachment,
  fetchTechnicianSupportTicket,
  updateSupportTicketComment,
  updateTechnicianSupportTicket,
} from "../services/support";
import "./SupportModule.css";

function TechnicianTicketDetail() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [status, setStatus] = useState("In Progress");
  const [resolutionNote, setResolutionNote] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [updatePanelOpen, setUpdatePanelOpen] = useState(false);
  const [commentPanelOpen, setCommentPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editingCommentId, setEditingCommentId] = useState("");
  const [editingCommentMessage, setEditingCommentMessage] = useState("");

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

  const handleEditCommentStart = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentMessage(comment.message || "");
    setError("");
  };

  const handleEditCommentCancel = () => {
    setEditingCommentId("");
    setEditingCommentMessage("");
  };

  const handleEditCommentSave = async (commentId) => {
    if (!editingCommentMessage.trim()) {
      setError("Comment message is required.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      const updated = await updateSupportTicketComment(ticket.id, commentId, { message: editingCommentMessage });
      setTicket(updated);
      handleEditCommentCancel();
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      setBusy(true);
      setError("");
      const updated = await deleteSupportTicketComment(ticket.id, commentId);
      setTicket(updated);
      if (editingCommentId === commentId) {
        handleEditCommentCancel();
      }
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const statusKey = (ticket?.status || "").toLowerCase().replace(/\s+/g, "-");

  return (
    <PortalLayout
      title="Technician Ticket Details"
      subtitle="Review ticket information and submit updates from this dedicated page."
      pageClassName="support-module-page"
      heroClassName="support-module-hero support-module-hero-detail"
      contentCardClassName="support-module-surface"
    >
      <div className="support-module-stack">
        <div className="support-breadcrumb-row">
          <Link className="ghost-btn" to="/technician/tickets">
            Back to Ticket List
          </Link>
        </div>

        {error ? <p className="support-inline-alert error-text">{error}</p> : null}
        {loading ? <p className="helper-text">Loading ticket...</p> : null}

        {!loading && !ticket ? (
          <article className="metric-card support-not-found-card">
            <h3>Ticket not found</h3>
            <p className="helper-text">This ticket may no longer be assigned to you.</p>
            <button className="ghost-btn" type="button" onClick={() => navigate("/technician/tickets")}>
              Go Back
            </button>
          </article>
        ) : null}

        {ticket ? (
          <article className="support-ticket-detail-shell">
            <div className="support-ticket-hero-card">
              <div className="support-ticket-detail-head">
                <div>
                  <span className="support-ticket-id-label">{ticket.ticketNumber || ticket.id}</span>
                  <h3>{ticket.title}</h3>
                  <p className="helper-text">
                    Student: {ticket.userName} | Location: {ticket.locationResource || "General request"}
                  </p>
                </div>
                <span className={`status-badge support-status-badge ${statusKey}`}>{ticket.status}</span>
              </div>

              <div className="support-ticket-detail-grid">
                <article className="support-detail-stat">
                  <span>Category</span>
                  <strong>{ticket.category}</strong>
                </article>
                <article className="support-detail-stat">
                  <span>Priority</span>
                  <strong>{ticket.priority}</strong>
                </article>
                <article className="support-detail-stat">
                  <span>Student</span>
                  <strong>{ticket.userName}</strong>
                </article>
                <article className="support-detail-stat">
                  <span>Contact</span>
                  <strong>{ticket.contactDetails || "-"}</strong>
                </article>
                <article className="support-detail-stat">
                  <span>Assigned</span>
                  <strong>{ticket.assignedTechnicianName || "Unassigned"}</strong>
                </article>
                <article className="support-detail-stat">
                  <span>Updated</span>
                  <strong>{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : "-"}</strong>
                </article>
              </div>
            </div>

            <div className="support-ticket-detail-columns">
              <section className="support-ticket-panel">
                <div className="support-ticket-detail-section">
                  <span className="support-eyebrow">Issue Summary</span>
                  <h4>Description</h4>
                  <p>{ticket.description}</p>
                </div>

                {ticket.resolutionNote ? (
                  <div className="support-ticket-detail-section">
                    <span className="support-eyebrow">Latest Resolution</span>
                    <h4>Resolution Note</h4>
                    <p>{ticket.resolutionNote}</p>
                  </div>
                ) : null}

                {ticket.comments?.length ? (
                  <div className="support-ticket-detail-section">
                    <span className="support-eyebrow">Timeline</span>
                    <h4>Comments</h4>
                    <div className="support-ticket-comment-list">
                      {ticket.comments.map((comment) => (
                        <article key={comment.id} className="support-ticket-comment-item">
                          <div className="support-comment-meta">
                            <strong>{comment.authorName}</strong>
                            <span className="helper-text">
                              {comment.authorRole} | {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ""}
                              {comment.updatedAt ? ` | Edited ${new Date(comment.updatedAt).toLocaleString()}` : ""}
                            </span>
                          </div>
                          {editingCommentId === comment.id ? (
                            <div className="support-comment-editor">
                              <textarea
                                value={editingCommentMessage}
                                onChange={(event) => setEditingCommentMessage(event.target.value)}
                                rows="3"
                              />
                              <div className="support-comment-actions">
                                <button
                                  className="solid-btn"
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleEditCommentSave(comment.id)}
                                >
                                  {busy ? "Saving..." : "Save"}
                                </button>
                                <button className="ghost-btn" type="button" onClick={handleEditCommentCancel}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p>{comment.message}</p>
                          )}
                          {user?.id === comment.authorUserId ? (
                            <div className="support-comment-actions support-comment-actions-inline">
                              {editingCommentId !== comment.id ? (
                                <button className="ghost-btn" type="button" onClick={() => handleEditCommentStart(comment)}>
                                  Edit
                                </button>
                              ) : null}
                              <button
                                className="ghost-btn"
                                type="button"
                                disabled={busy}
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                {busy ? "Working..." : "Delete"}
                              </button>
                            </div>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>

              <aside className="support-ticket-sidebar">
                {ticket.attachments?.length ? (
                  <div className="support-ticket-panel support-ticket-detail-section">
                    <span className="support-eyebrow">Files</span>
                    <h4>Attachments</h4>
                    <ul className="support-ticket-attachment-list">
                      {ticket.attachments.map((attachment) => (
                        <li key={attachment.id} className="support-attachment-card">
                          <div>
                            <strong>{attachment.originalFileName}</strong>
                            <span className="helper-text">
                              {attachment.uploadedByName} | {attachment.createdAt ? new Date(attachment.createdAt).toLocaleString() : ""}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="ghost-btn"
                            onClick={() => handleAttachmentOpen(attachment)}
                            aria-label={`Download ${attachment.originalFileName}`}
                            title={`Download ${attachment.originalFileName}`}
                          >
                            Download
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="support-ticket-panel support-ticket-detail-section">
                  <span className="support-eyebrow">Action Panel</span>
                  <h4>Update Ticket</h4>
                  <button
                    type="button"
                    className="solid-btn"
                    onClick={() => setUpdatePanelOpen((current) => !current)}
                  >
                    {updatePanelOpen ? "Close Update Ticket" : "Update Ticket"}
                  </button>
                  {updatePanelOpen ? (
                    <div className="admin-ticket-actions support-comment-form support-action-panel">
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

                <div className="support-ticket-panel support-ticket-detail-section">
                  <span className="support-eyebrow">Technician Note</span>
                  <h4>Add Technician Update</h4>
                  <button
                    type="button"
                    className="solid-btn"
                    onClick={() => setCommentPanelOpen((current) => !current)}
                  >
                    {commentPanelOpen ? "Close Technician Update" : "Add Technician Update"}
                  </button>
                  {commentPanelOpen ? (
                    <div className="admin-ticket-actions support-comment-form support-action-panel">
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
              </aside>
            </div>
          </article>
        ) : null}
      </div>
    </PortalLayout>
  );
}

export default TechnicianTicketDetail;
