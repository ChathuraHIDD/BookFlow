import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/useAuth";
import { readApiError } from "../services/api";
import {
  addSupportTicketComment,
  deleteSupportTicketComment,
  downloadSupportAttachment,
  fetchMySupportTicket,
  updateSupportTicketComment,
} from "../services/support";
import "./SupportModule.css";

function StudentSupportTicket() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentMessage, setCommentMessage] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState("");
  const [editingCommentMessage, setEditingCommentMessage] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchMySupportTicket(id);
        if (active) {
          setTicket(data);
        }
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
  }, [id]);

  useEffect(() => {
    if (!commentModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [commentModalOpen]);

  const statusKey = (ticket?.status || "").toLowerCase().replace(/\s+/g, "-");
  const commentCount = ticket?.comments?.length || 0;
  const attachmentCount = ticket?.attachments?.length || 0;

  const refreshTicket = async () => {
    const data = await fetchMySupportTicket(id);
    setTicket(data);
  };

  const onAddComment = async () => {
    if (!commentMessage.trim()) {
      return;
    }

    try {
      setCommentBusy(true);
      setError("");
      await addSupportTicketComment(id, { message: commentMessage });
      setCommentMessage("");
      await refreshTicket();
      setCommentModalOpen(false);
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setCommentBusy(false);
    }
  };

  const onStartEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentMessage(comment.message || "");
    setError("");
  };

  const onCancelEditComment = () => {
    setEditingCommentId("");
    setEditingCommentMessage("");
  };

  const onSaveEditedComment = async (commentId) => {
    if (!editingCommentMessage.trim()) {
      setError("Comment message is required.");
      return;
    }

    try {
      setCommentBusy(true);
      setError("");
      const updated = await updateSupportTicketComment(id, commentId, { message: editingCommentMessage });
      setTicket(updated);
      onCancelEditComment();
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setCommentBusy(false);
    }
  };

  const onDeleteComment = async (commentId) => {
    try {
      setCommentBusy(true);
      setError("");
      const updated = await deleteSupportTicketComment(id, commentId);
      setTicket(updated);
      if (editingCommentId === commentId) {
        onCancelEditComment();
      }
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setCommentBusy(false);
    }
  };

  const onOpenAttachment = async (attachment) => {
    try {
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
    }
  };

  return (
    <PortalLayout
      title="Support Ticket Details"
      subtitle="View the details, priority, and current status of one support request."
      pageClassName="support-module-page"
      heroClassName="support-module-hero support-module-hero-detail"
      contentCardClassName="support-module-surface"
    >
      <div className="support-module-stack">
        <div className="support-breadcrumb-row">
          <Link className="ghost-btn" to="/student/support">
            Back to Tickets
          </Link>
        </div>

        {loading ? <p className="helper-text">Loading ticket details...</p> : null}
        {error ? <p className="support-inline-alert error-text">{error}</p> : null}

        {!loading && ticket ? (
          <article className="support-ticket-detail-shell">
            <div className="support-ticket-hero-card">
              <div className="support-ticket-detail-head">
                <div>
                  <span className="support-ticket-id-label">{ticket.ticketNumber || ticket.id}</span>
                  <h3>{ticket.title}</h3>
                  <p className="helper-text">
                    Submitted by {ticket.userName} for {ticket.locationResource || "General request"}
                  </p>
                </div>
                <span className={`status-badge support-status-badge ${statusKey}`}>{ticket.status}</span>
              </div>

              <div className="support-ticket-signal-strip">
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
                  <span>Current Stage</span>
                  <strong>{ticket.status || "Open"}</strong>
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
                  <span>Created</span>
                  <strong>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "-"}</strong>
                </article>
                <article className="support-detail-stat">
                  <span>Last Updated</span>
                  <strong>{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : "-"}</strong>
                </article>
                <article className="support-detail-stat">
                  <span>Resolved</span>
                  <strong>{ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleString() : "-"}</strong>
                </article>
                <article className="support-detail-stat">
                  <span>Contact</span>
                  <strong>{ticket.contactDetails || "-"}</strong>
                </article>
                <article className="support-detail-stat support-detail-stat-full">
                  <span>Description</span>
                  <p>{ticket.description || "-"}</p>
                </article>
              </div>
            </div>

            <div className="support-ticket-detail-columns">
              <section className="support-ticket-panel">
                {ticket.comments?.length ? (
                  <div className="support-ticket-detail-section support-updates-section">
                    <span className="support-eyebrow">Updates</span>
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
                                  disabled={commentBusy}
                                  onClick={() => onSaveEditedComment(comment.id)}
                                >
                                  {commentBusy ? "Saving..." : "Save"}
                                </button>
                                <button className="ghost-btn" type="button" onClick={onCancelEditComment}>
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
                                <button className="ghost-btn" type="button" onClick={() => onStartEditComment(comment)}>
                                  Edit
                                </button>
                              ) : null}
                              <button
                                className="ghost-btn"
                                type="button"
                                disabled={commentBusy}
                                onClick={() => onDeleteComment(comment.id)}
                              >
                                {commentBusy ? "Working..." : "Delete"}
                              </button>
                            </div>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="support-ticket-detail-section support-updates-section">
                    <span className="support-eyebrow">Updates</span>
                    <h4>Comments</h4>
                    <article className="support-inline-empty-card">
                      <strong>No conversation yet</strong>
                      <p className="helper-text">Add a comment to share context or follow up with the technician.</p>
                    </article>
                  </div>
                )}

                <div className="support-comment-cta-row">
                  <button
                    className="solid-btn"
                    type="button"
                    onClick={() => {
                      setError("");
                      setCommentModalOpen(true);
                    }}
                  >
                    Add Comment
                  </button>
                </div>
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
                            onClick={() => onOpenAttachment(attachment)}
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

                {ticket.adminNote ? (
                  <div className="support-ticket-panel support-ticket-detail-section">
                    <span className="support-eyebrow">Admin Review</span>
                    <h4>Admin Note</h4>
                    <p>{ticket.adminNote}</p>
                  </div>
                ) : null}

                <div className="support-ticket-panel support-ticket-detail-section support-ticket-health-card">
                  <span className="support-eyebrow">Ticket Health</span>
                  <h4>Progress Snapshot</h4>
                  <div className="support-health-list">
                    <div>
                      <span>Created</span>
                      <strong>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "-"}</strong>
                    </div>
                    <div>
                      <span>Last activity</span>
                      <strong>{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : "-"}</strong>
                    </div>
                    <div>
                      <span>Resolution</span>
                      <strong>{ticket.resolvedAt ? "Completed" : "In progress"}</strong>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </article>
        ) : null}

        {!loading && !ticket ? (
          <article className="metric-card support-not-found-card">
            <h3>Ticket not found</h3>
            <p className="helper-text">We could not find a support ticket for this ID.</p>
          </article>
        ) : null}

        {commentModalOpen
          ? createPortal(
              <div
                className="support-modal-backdrop"
                role="dialog"
                aria-modal="true"
                aria-labelledby="student-comment-modal-title"
                onClick={() => {
                  if (!commentBusy) {
                    setCommentModalOpen(false);
                  }
                }}
              >
                <div className="support-modal-card" onClick={(event) => event.stopPropagation()}>
                  <button
                    className="support-modal-close"
                    type="button"
                    aria-label="Close add comment dialog"
                    onClick={() => setCommentModalOpen(false)}
                    disabled={commentBusy}
                  >
                    ×
                  </button>
                  <h4 id="student-comment-modal-title">Add Comment</h4>
                  <p className="helper-text">Share any follow-up details for your support request.</p>
                  <textarea
                    value={commentMessage}
                    onChange={(event) => setCommentMessage(event.target.value)}
                    rows="5"
                    placeholder="Write your comment"
                  />
                  <div className="support-modal-actions">
                    <button
                      className="ghost-btn"
                      type="button"
                      disabled={commentBusy}
                      onClick={() => setCommentModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="solid-btn"
                      type="button"
                      disabled={commentBusy || !commentMessage.trim()}
                      onClick={onAddComment}
                    >
                      {commentBusy ? "Posting..." : "Save Comment"}
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

export default StudentSupportTicket;
