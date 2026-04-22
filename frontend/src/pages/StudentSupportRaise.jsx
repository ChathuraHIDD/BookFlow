import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PortalLayout from "../components/PortalLayout";
import { readApiError } from "../services/api";
import { createSupportTicket } from "../services/support";

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
      subtitle="Fill in the details below to prepare a new incident request. This page uses local React state only."
    >
      <div className="cta-row" style={{ marginBottom: "14px" }}>
        <Link className="ghost-btn" to="/student/support">
          Back to Support
        </Link>
      </div>

      {error ? <p className="error-text" style={{ marginBottom: "12px" }}>{error}</p> : null}
      {message ? <p className="helper-text" style={{ marginBottom: "12px" }}>{message}</p> : null}

      <form className="form-grid" onSubmit={handleSubmit}>
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

        <label htmlFor="locationResource">
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

        <label htmlFor="description">
          Description
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="4"
            placeholder="Describe the issue clearly"
            required
          />
        </label>

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

        <label htmlFor="attachments">
          Attach Images (Optional, up to 3)
          <input
            id="attachments"
            name="attachments"
            type="file"
            accept="image/*"
            multiple
            onChange={handleAttachmentChange}
          />
          <small className="helper-text">
            Add screenshots or photos to help explain the incident.
          </small>

          {attachments.length ? (
            <div style={{ marginTop: "10px" }}>
              <p className="helper-text" style={{ marginBottom: "8px" }}>
                Selected files: {attachments.length}/3
              </p>
              <ul style={{ margin: 0, paddingLeft: "18px" }}>
                {attachments.map((file, index) => (
                  <li key={`${file.name}-${file.size}-${file.lastModified}`} style={{ marginBottom: "6px" }}>
                    <span>{file.name}</span>
                    <button
                      type="button"
                      className="ghost-btn"
                      style={{ marginLeft: "8px", padding: "4px 8px" }}
                      onClick={() => handleRemoveAttachment(index)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="ghost-btn"
                style={{ marginTop: "8px" }}
                onClick={handleClearAttachments}
              >
                Clear all
              </button>
            </div>
          ) : null}
        </label>

        <button className="solid-btn" type="submit" disabled={busy}>
          {busy ? "Saving..." : "Create Ticket"}
        </button>
      </form>
    </PortalLayout>
  );
}

export default StudentSupportRaise;
