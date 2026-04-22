import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PortalLayout from "../components/PortalLayout";
import { readApiError } from "../services/api";
import { createSupportTicket } from "../services/support";
import "./SupportModule.css";

const initialForm = {
  title: "",
  category: "Technical",
  locationResource: "",
  description: "",
  priority: "Medium",
  contactDetails: "",
};

function StudentSupportRaise() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [attachments, setAttachments] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const submit = async () => {
      try {
        setBusy(true);
        setError("");
        setMessage("");
        const created = await createSupportTicket(form, attachments);
        setMessage(`Ticket ${created.ticketNumber} created successfully.`);
        setForm(initialForm);
        setAttachments([]);
        navigate(`/student/support/${created.id}`);
      } catch (err) {
        setError(readApiError(err));
      } finally {
        setBusy(false);
      }
    };

    submit();
  };

  const handleAttachmentChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    const nonImage = files.find((file) => !file.type?.startsWith("image/"));
    if (nonImage) {
      setError("Only image attachments are allowed.");
      event.target.value = "";
      return;
    }

    const nextAttachments = [...attachments];
    for (const file of files) {
      const duplicate = nextAttachments.some(
        (item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified,
      );
      if (!duplicate) {
        nextAttachments.push(file);
      }
    }

    if (nextAttachments.length > 3) {
      setError("You can upload a maximum of 3 image attachments.");
      event.target.value = "";
      return;
    }

    setError("");
    setAttachments(nextAttachments);
    event.target.value = "";
  };

  const handleRemoveAttachment = (indexToRemove) => {
    setAttachments((current) => current.filter((_, index) => index !== indexToRemove));
    setError("");
  };

  const handleClearAttachments = () => {
    setAttachments([]);
    setError("");
  };

  return (
    <PortalLayout
      title="Raise New Support Ticket"
      subtitle="Share the issue clearly, add screenshots if helpful, and send everything through one structured request."
      pageClassName="support-module-page"
      heroClassName="support-module-hero support-module-hero-raise"
      contentCardClassName="support-module-surface"
    >
      <div className="support-module-stack">
        <div className="support-breadcrumb-row">
          <Link className="ghost-btn" to="/student/support">
            Back to Support
          </Link>
        </div>

        {error ? <p className="support-inline-alert error-text">{error}</p> : null}
        {message ? <p className="support-inline-alert support-inline-note helper-text">{message}</p> : null}

        <div className="support-raise-layout">
          <form className="support-raise-form" onSubmit={handleSubmit}>
            <section className="support-form-section">
              <div className="support-form-section-head">
                <span className="support-eyebrow">Ticket Basics</span>
                <h3>What happened?</h3>
                <p className="helper-text">
                  Give the issue a short title and classify it so the right team can pick it up quickly.
                </p>
              </div>

              <div className="support-form-grid support-form-grid-two">
                <label htmlFor="title">
                  Title
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Example: Unable to borrow book"
                    required
                  />
                </label>

                <label htmlFor="category">
                  Category
                  <select id="category" name="category" value={form.category} onChange={handleChange}>
                    <option>Technical</option>
                    <option>Borrowing</option>
                    <option>Account</option>
                    <option>Other</option>
                  </select>
                </label>

                <label className="support-form-span-full" htmlFor="locationResource">
                  Location / Resource
                  <input
                    id="locationResource"
                    name="locationResource"
                    type="text"
                    value={form.locationResource}
                    onChange={handleChange}
                    placeholder="Example: Main campus computer lab / NNIC Smart Campus app"
                    required
                  />
                </label>

                <label className="support-form-span-full" htmlFor="description">
                  Description
                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows="6"
                    placeholder="Describe the issue clearly"
                    required
                  />
                </label>
              </div>
            </section>

            <section className="support-form-section">
              <div className="support-form-section-head">
                <span className="support-eyebrow">Priority & Contact</span>
                <h3>Help us respond the right way</h3>
              </div>

              <div className="support-form-grid support-form-grid-two">
                <label htmlFor="priority">
                  Priority
                  <select id="priority" name="priority" value={form.priority} onChange={handleChange}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </label>

                <label htmlFor="contactDetails">
                  Contact Details
                  <input
                    id="contactDetails"
                    name="contactDetails"
                    type="text"
                    value={form.contactDetails}
                    onChange={handleChange}
                    placeholder="Phone number or email"
                    required
                  />
                </label>
              </div>
            </section>

            <section className="support-form-section">
              <div className="support-form-section-head">
                <span className="support-eyebrow">Evidence</span>
                <h3>Add supporting images</h3>
              </div>

              <label className="support-upload-panel" htmlFor="attachments">
                <span className="support-upload-title">Attach Images (Optional, up to 3)</span>
                <span className="support-upload-copy helper-text">
                  Add screenshots or photos to help explain the incident.
                </span>
                <input
                  id="attachments"
                  name="attachments"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAttachmentChange}
                />
              </label>

              {attachments.length ? (
                <div className="support-attachment-panel">
                  <div className="support-attachment-panel-head">
                    <p className="helper-text">Selected files: {attachments.length}/3</p>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={handleClearAttachments}
                    >
                      Clear all
                    </button>
                  </div>

                  <ul className="support-attachment-chip-list">
                    {attachments.map((file, index) => (
                      <li key={`${file.name}-${file.size}-${file.lastModified}`} className="support-attachment-chip">
                        <div>
                          <strong>{file.name}</strong>
                          <span>{Math.max(1, Math.round(file.size / 1024))} KB</span>
                        </div>
                        <button
                          type="button"
                          className="ghost-btn support-chip-remove"
                          onClick={() => handleRemoveAttachment(index)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <div className="support-form-actions">
              <button className="ghost-btn" type="button" onClick={() => navigate("/student/support")}>
                Cancel
              </button>
              <button className="solid-btn" type="submit" disabled={busy}>
                {busy ? "Saving..." : "Create Ticket"}
              </button>
            </div>
          </form>

          <aside className="support-raise-sidebar">
            <section className="support-side-card">
              <span className="support-eyebrow">Checklist</span>
              <h3>What helps us resolve faster</h3>
              <ul className="support-side-list">
                <li>Use a short, specific title instead of a full paragraph.</li>
                <li>Mention the exact room, app page, or resource affected.</li>
                <li>Include what you already tried before reporting it.</li>
                <li>Add screenshots when the issue is visible on screen.</li>
              </ul>
            </section>

            <section className="support-side-card support-side-card-accent">
              <span className="support-eyebrow">Response Flow</span>
              <h3>What happens after submission</h3>
              <div className="support-side-steps">
                <div>
                  <strong>1. Review</strong>
                  <p className="helper-text">Your request is logged and categorized for triage.</p>
                </div>
                <div>
                  <strong>2. Assignment</strong>
                  <p className="helper-text">A technician or reviewer is assigned if needed.</p>
                </div>
                <div>
                  <strong>3. Follow-up</strong>
                  <p className="helper-text">You can return to the ticket page to add comments and track status.</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </PortalLayout>
  );
}

export default StudentSupportRaise;
