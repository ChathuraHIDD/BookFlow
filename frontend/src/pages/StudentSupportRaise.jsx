import { useState } from "react";
import { Link } from "react-router-dom";

import PortalLayout from "../components/PortalLayout";

const initialForm = {
  title: "",
  category: "Technical",
  locationResource: "",
  description: "",
  priority: "Medium",
  contactDetails: "",
};

function StudentSupportRaise() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage(`Draft saved for ${form.title || "your support request"}.`);
    setForm(initialForm);
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
            placeholder="Example: Main library computer lab / BookFlow app"
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

        <button className="solid-btn" type="submit">
          Save Ticket Draft
        </button>
      </form>
    </PortalLayout>
  );
}

export default StudentSupportRaise;
