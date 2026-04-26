import { useState } from "react";
import PortalLayout from "../components/PortalLayout";
import "./StudentAcademicHub.css";

const MOCK_NOTES = [
  { id: 1, title: "Database Normalization Guide", date: "2026-04-20", type: "PDF", summary: "Covers 1NF, 2NF, 3NF and BCNF with examples." },
  { id: 2, title: "React Context API Overview", date: "2026-04-18", type: "DOCX", summary: "Explains state management without prop drilling." },
  { id: 3, title: "Business Ethics Lecture 05", date: "2026-04-15", type: "PDF", summary: "Key takeaways on corporate responsibility." },
];

function AINotes() {
  const [notes] = useState(MOCK_NOTES);

  return (
    <PortalLayout 
      title="AI Academic Notes" 
      subtitle="Smart note management and AI-generated study summaries."
    >
      <div className="academic-hub-stack">
        <section className="academic-banner" style={{ background: 'linear-gradient(135deg, #4f46e5, #9333ea)' }}>
          <h2>Smart Note Management</h2>
          <p>Upload your lecture notes and let our AI distill them into key concepts, summaries, and flashcards.</p>
          <button className="solid-btn" style={{ marginTop: '20px', background: 'white', color: '#4f46e5' }}>Upload New Note</button>
        </section>

        <section className="notes-directory">
          <div className="admin-booking-panel-head" style={{ marginBottom: '20px' }}>
            <div>
              <h3>Recent Notes</h3>
              <p>Your document library with AI-enhanced insights.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {notes.map(n => (
              <article key={n.id} className="note-card">
                <div className="note-card-icon">📄</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: 0 }}>{n.title}</h4>
                    <span className="session-tag" style={{ background: '#fef3c7', color: '#92400e' }}>AI Summary Ready</span>
                  </div>
                  <p className="helper-text" style={{ margin: '4px 0' }}>{n.type} | Added on {n.date}</p>
                  <div style={{ 
                    marginTop: '10px', 
                    padding: '12px', 
                    background: '#f8fafc', 
                    borderRadius: '12px',
                    borderLeft: '4px solid #4f46e5',
                    fontSize: '0.9rem',
                    color: '#475569'
                  }}>
                    <strong>AI Highlight:</strong> {n.summary}
                  </div>
                </div>
                <button className="ghost-btn">View</button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </PortalLayout>
  );
}

export default AINotes;
