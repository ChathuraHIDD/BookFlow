import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import PortalLayout from "../components/PortalLayout";
import SupportDropdown from "../components/SupportDropdown";
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
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
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
        setStatusModalOpen(false);
        setCommentModalOpen(false);
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

  useEffect(() => {
    if (!statusModalOpen && !commentModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [statusModalOpen, commentModalOpen]);

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
      setStatusModalOpen(false);
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
      setCommentModalOpen(false);
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
  const commentCount = ticket?.comments?.length || 0;
  const attachmentCount = ticket?.attachments?.length || 0;

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

              <div className="support-ticket-signal-strip support-ticket-signal-strip-tech">
                <article>
                  <span className="support-signal-icon support-signal-icon-priority" aria-hidden="true" />
                  <span>Priority</span>
                  <strong>{ticket.priority}</strong>
                </article>
                <article>
                  <span className="support-signal-icon support-signal-icon-comments" aria-hidden="true" />
                  <span>Comments</span>
                  <strong>{commentCount}</strong>
                </article>
                <article>
                  <span className="support-signal-icon support-signal-icon-attachments" aria-hidden="true" />
                  <span>Attachments</span>
                  <strong>{attachmentCount}</strong>
                </article>
                <article>
                  <span className="support-signal-icon support-signal-icon-stage" aria-hidden="true" />
                  <span>Assigned to</span>
                  <strong>{ticket.assignedTechnicianName || "Unassigned"}</strong>
                </article>
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
              <div className="support-ticket-sidebar">
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
                            <p className="support-comment-message">{comment.message}</p>
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
                ) : (
                  <div className="support-ticket-detail-section">
                    <span className="support-eyebrow">Timeline</span>
                    <h4>Comments</h4>
                    <article className="support-inline-empty-card">
                      <strong>No updates posted yet</strong>
                      <p className="helper-text">Add a technician update so the student can follow progress.</p>
                    </article>
                  </div>
                )}

                <div className="support-comment-cta-row">
                  <button
                    type="button"
                    className="solid-btn"
                    onClick={() => {
                      setError("");
                      setCommentModalOpen(true);
                    }}
                  >
                    Add Update
                  </button>
                </div>
                </section>

                <section className="support-ticket-panel support-ticket-detail-section support-tech-top-spaced-panel">
                  <span className="support-eyebrow">Action Panel</span>
                  <h4>Edit Status</h4>
                  <button
                    type="button"
                    className="solid-btn"
                    onClick={() => {
                      setError("");
                      setStatusModalOpen(true);
                    }}
                  >
                    Edit Status
                  </button>
                </section>
              </div>

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

                <div className="support-ticket-panel support-ticket-detail-section support-tech-top-spaced-panel">
                  <span className="support-eyebrow">Operational View</span>
                  <h4>Queue Snapshot</h4>
                  <div className="support-health-list">
                    <div>
                      <span>Created</span>
                      <strong>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "-"}</strong>
                    </div>
                    <div>
                      <span>Latest update</span>
                      <strong>{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : "-"}</strong>
                    </div>
                    <div>
                      <span>Status class</span>
                      <strong>{ticket.status || "Open"}</strong>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </article>
        ) : null}

        {ticket && statusModalOpen
          ? createPortal(
              <div
                className="support-modal-backdrop"
                role="dialog"
                aria-modal="true"
                aria-labelledby="technician-status-modal-title"
                onClick={() => {
                  if (!busy) {
                    setStatusModalOpen(false);
                  }
                }}
              >
                <div className="support-modal-card support-admin-ticket-modal" onClick={(event) => event.stopPropagation()}>
                  <button
                    className="support-modal-close"
                    type="button"
                    aria-label="Close edit status dialog"
                    onClick={() => setStatusModalOpen(false)}
                    disabled={busy}
                  >
                    X
                  </button>
                  <h4 id="technician-status-modal-title">Edit Status</h4>
                  <p className="helper-text">
                    {ticket.ticketNumber || ticket.id} - {ticket.title}
                  </p>
                  <div className="support-admin-action-card support-admin-action-card-modal">
                    <SupportDropdown
                      id="technician-status"
                      label="Status"
                      value={status}
                      onChange={setStatus}
                      options={[
                        { value: "In Progress", label: "In Progress" },
                        { value: "Resolved", label: "Resolved" },
                      ]}
                    />
                    <label className="support-admin-action-field">
                      <span>Resolution Note</span>
                      <textarea
                        value={resolutionNote}
                        onChange={(event) => setResolutionNote(event.target.value)}
                        placeholder="Add a resolution note"
                        rows="4"
                      />
                    </label>
                  </div>
                  <div className="support-modal-actions">
                    <button
                      className="ghost-btn"
                      type="button"
                      disabled={busy}
                      onClick={() => setStatusModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button className="solid-btn support-admin-save-btn" type="button" disabled={busy} onClick={handleSave}>
                      {busy ? "Saving..." : "Save Status"}
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )
          : null}

        {ticket && commentModalOpen
          ? createPortal(
              <div
                className="support-modal-backdrop"
                role="dialog"
                aria-modal="true"
                aria-labelledby="technician-comment-modal-title"
                onClick={() => {
                  if (!busy) {
                    setCommentModalOpen(false);
                  }
                }}
              >
                <div className="support-modal-card support-admin-ticket-modal" onClick={(event) => event.stopPropagation()}>
                  <button
                    className="support-modal-close"
                    type="button"
                    aria-label="Close add update dialog"
                    onClick={() => setCommentModalOpen(false)}
                    disabled={busy}
                  >
                    X
                  </button>
                  <h4 id="technician-comment-modal-title">Add Update</h4>
                  <p className="helper-text">
                    {ticket.ticketNumber || ticket.id} - {ticket.title}
                  </p>
                  <div className="support-admin-action-card support-admin-action-card-modal">
                    <label className="support-admin-action-field">
                      <span>Technician Update</span>
                      <textarea
                        value={commentDraft}
                        onChange={(event) => setCommentDraft(event.target.value)}
                        placeholder="Add a progress update or note for the student"
                        rows="4"
                      />
                    </label>
                  </div>
                  <div className="support-modal-actions">
                    <button
                      className="ghost-btn"
                      type="button"
                      disabled={busy}
                      onClick={() => setCommentModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button className="solid-btn support-admin-save-btn" type="button" disabled={busy} onClick={handleCommentSave}>
                      {busy ? "Posting..." : "Post Update"}
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )
          : null}
      </div>
    </PortalLayout>
  );
}

export default TechnicianTicketDetail;
