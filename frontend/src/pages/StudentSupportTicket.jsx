import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import PortalLayout from "../components/PortalLayout";
import { readApiError } from "../services/api";
import {
  addSupportTicketAttachment,
  addSupportTicketComment,
  fetchMySupportTicket,
} from "../services/support";

function StudentSupportTicket() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentMessage, setCommentMessage] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentBusy, setAttachmentBusy] = useState(false);

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

  const statusKey = (ticket?.status || "").toLowerCase().replace(/\s+/g, "-");

  const refreshTicket = async () => {
    const data = await fetchMySupportTicket(id);
    setTicket(data);
  };

  const onAddComment = async (event) => {
    event.preventDefault();
    if (!commentMessage.trim()) {
      return;
    }

    try {
      setCommentBusy(true);
      setError("");
      await addSupportTicketComment(id, { message: commentMessage });
      setCommentMessage("");
      await refreshTicket();
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setCommentBusy(false);
    }
  };

  const onAddAttachment = async (event) => {
    event.preventDefault();
    if (!attachmentFile) {
      return;
    }

    try {
      setAttachmentBusy(true);
      setError("");
      await addSupportTicketAttachment(id, attachmentFile);
      setAttachmentFile(null);
      await refreshTicket();
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setAttachmentBusy(false);
    }
  };

  return (
    <PortalLayout
      title="Support Ticket Details"
      subtitle="View the details, priority, and current status of one support request."
    >
      <div className="cta-row" style={{ marginBottom: "14px" }}>
        <Link className="ghost-btn" to="/student/support">
          Back to Support
        </Link>
      </div>

      {loading ? <p className="helper-text">Loading ticket details...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading && ticket ? (
        <article className="metric-card support-ticket-detail-card">
          <div className="support-ticket-detail-head">
            <div>
              <p className="helper-text">{ticket.ticketNumber || ticket.id}</p>
              <h3>{ticket.title}</h3>
            </div>
            <span className={`status-badge support-status-badge ${statusKey}`}>{ticket.status}</span>
          </div>

          <div className="support-ticket-detail-grid">
            <p><strong>Category:</strong> {ticket.category}</p>
            <p><strong>Priority:</strong> {ticket.priority}</p>
            <p><strong>Location / Resource:</strong> {ticket.locationResource}</p>
            <p><strong>Created:</strong> {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "-"}</p>
            <p><strong>Updated:</strong> {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : "-"}</p>
            <p><strong>Resolved:</strong> {ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleString() : "-"}</p>
            <p><strong>Contact:</strong> {ticket.contactDetails}</p>
            <p><strong>Student:</strong> {ticket.userName}</p>
          </div>

          <div className="support-ticket-detail-section">
            <h4>Description</h4>
            <p>{ticket.description}</p>
          </div>

          <div className="support-ticket-detail-section">
            <h4>Add Comment</h4>
            <form className="admin-ticket-actions" onSubmit={onAddComment}>
              <textarea
                value={commentMessage}
                onChange={(event) => setCommentMessage(event.target.value)}
                rows="3"
                placeholder="Add a follow-up comment"
              />
              <button className="solid-btn" type="submit" disabled={commentBusy || !commentMessage.trim()}>
                {commentBusy ? "Posting..." : "Post Comment"}
              </button>
            </form>
          </div>

          <div className="support-ticket-detail-section">
            <h4>Attach File</h4>
            <form className="admin-ticket-actions" onSubmit={onAddAttachment}>
              <input
                type="file"
                onChange={(event) => setAttachmentFile(event.target.files?.[0] || null)}
              />
              <button className="solid-btn" type="submit" disabled={attachmentBusy || !attachmentFile}>
                {attachmentBusy ? "Uploading..." : "Upload Attachment"}
              </button>
            </form>
          </div>

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

          {ticket.adminNote ? (
            <div className="support-ticket-detail-section">
              <h4>Admin Note</h4>
              <p>{ticket.adminNote}</p>
            </div>
          ) : null}
        </article>
      ) : null}

      {!loading && !ticket ? (
        <article className="metric-card">
          <h3>Ticket not found</h3>
          <p className="helper-text">We could not find a support ticket for this ID.</p>
        </article>
      ) : null}
    </PortalLayout>
  );
}

export default StudentSupportTicket;
