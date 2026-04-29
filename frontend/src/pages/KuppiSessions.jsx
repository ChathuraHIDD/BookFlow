import { useState } from "react";
import { createPortal } from "react-dom";
import PortalLayout from "../components/PortalLayout";
import "./StudentAcademicHub.css";

const MOCK_SESSIONS = [
  { id: 1, title: "DBMS Discussion", conductor: "Saumya Perera", time: "Tomorrow, 10:00 AM", location: "Online", tags: ["IT", "Database"] },
  { id: 2, title: "Algorithms Deep Dive", conductor: "Imesh Harshana", time: "Friday, 2:00 PM", location: "Library Lab 01", tags: ["IT", "Algorithms"] },
  { id: 3, title: "Business Law Basics", conductor: "Nethmi Silva", time: "Monday, 9:00 AM", location: "Lecture Hall A", tags: ["Law", "General"] },
];

function KuppiSessions() {
  const [sessions] = useState(MOCK_SESSIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formBusy, setFormBusy] = useState(false);

  const onApplySubmit = (e) => {
    e.preventDefault();
    setFormBusy(true);
    setTimeout(() => {
      alert("Kuppi conductor request sent to admin successfully!");
      setFormBusy(false);
      setIsModalOpen(false);
    }, 1000);
  };

  return (
    <PortalLayout 
      title="Kuppi Sessions" 
      subtitle="Peer-to-peer teaching and academic support community."
    >
      <div className="academic-hub-stack">
        <section className="academic-banner">
          <h2>Peer Learning Hub</h2>
          <p>Join student-led "Kuppi" sessions to master complex topics or apply to become a conductor and share your expertise.</p>
          <button 
            className="solid-btn" 
            style={{ marginTop: '20px', background: 'white', color: '#1e3a8a' }}
            onClick={() => setIsModalOpen(true)}
          >
            Join as a Kuppi Conductor
          </button>
        </section>

        <section className="session-directory">
          <div className="admin-booking-panel-head" style={{ marginBottom: '20px' }}>
            <div>
              <h3>Active Sessions</h3>
              <p>Upcoming peer-teaching sessions across all departments.</p>
            </div>
          </div>

          <div className="session-grid">
            {sessions.map(s => (
              <article key={s.id} className="session-card">
                <div className="session-card-head">
                  <div className="session-tag-row">
                    {s.tags.map(t => <span key={t} className="session-tag">{t}</span>)}
                  </div>
                </div>
                <h4>{s.title}</h4>
                <div className="helper-text" style={{ display: 'grid', gap: '4px' }}>
                  <span>👨‍🏫 <strong>{s.conductor}</strong></span>
                  <span>⏰ {s.time}</span>
                  <span>📍 {s.location}</span>
                </div>
                <button className="ghost-btn" style={{ marginTop: '10px' }}>Remind Me</button>
              </article>
            ))}
          </div>
        </section>

        {isModalOpen && createPortal(
          <div className="admin-booking-modal-overlay" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
            <aside className="admin-booking-detail-modal" style={{ maxWidth: '500px' }}>
              <div className="admin-booking-modal-head">
                <div>
                  <p className="student-modern-section-label">Academic Contribution</p>
                  <h3>Conductor Application</h3>
                </div>
                <button className="ghost-btn" onClick={() => setIsModalOpen(false)}>Close</button>
              </div>

              <form onSubmit={onApplySubmit} style={{ display: 'grid', gap: '16px' }}>
                <label className="admin-booking-filter-field">Full Name
                  <input placeholder="Your full name" required />
                </label>
                <label className="admin-booking-filter-field">Subject Area
                  <select required>
                    <option value="IT">Information Technology</option>
                    <option value="BS">Business Studies</option>
                    <option value="LAW">Law</option>
                  </select>
                </label>
                <label className="admin-booking-filter-field">Why do you want to conduct?
                  <textarea placeholder="Describe your experience or motivation..." rows="4" required />
                </label>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" className="solid-btn" disabled={formBusy}>
                    {formBusy ? "Submitting..." : "Submit Application"}
                  </button>
                  <button type="button" className="ghost-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                </div>
              </form>
            </aside>
          </div>,
          document.body
        )}
      </div>
    </PortalLayout>
  );
}

export default KuppiSessions;
