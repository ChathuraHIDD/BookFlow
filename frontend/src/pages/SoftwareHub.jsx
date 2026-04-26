import { useState } from "react";
import { createPortal } from "react-dom";
import PortalLayout from "../components/PortalLayout";
import "./StudentAcademicHub.css";

const MOCK_SOFTWARE = [
  { id: 1, name: "Visual Studio Code", version: "1.85", category: "Development", emoji: "💻" },
  { id: 2, name: "IntelliJ IDEA", version: "2023.3", category: "Development", emoji: "☕" },
  { id: 3, name: "Postman", version: "10.21", category: "API", emoji: "🚀" },
  { id: 4, name: "Docker Desktop", version: "4.26", category: "DevOps", emoji: "🐋" },
  { id: 5, name: "Microsoft Teams", version: "2.1", category: "Collaboration", emoji: "👥" },
  { id: 6, name: "Matlab", version: "R2023b", category: "Engineering", emoji: "📊" },
];

function SoftwareHub() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSoftware, setSelectedSoftware] = useState(null);

  const filteredSoftware = MOCK_SOFTWARE.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PortalLayout 
      title="Software Hub" 
      subtitle="Authorized academic software and development tools repository."
    >
      <div className="academic-hub-stack">
        <section className="academic-banner" style={{ background: 'linear-gradient(135deg, #0f172a, #334155)' }}>
          <h2>Resource Repository</h2>
          <p>Download pre-configured software packages, IDEs, and essential utilities for your degree program.</p>
        </section>

        <section className="software-directory">
          <div className="admin-booking-panel-head" style={{ marginBottom: '20px' }}>
            <div>
              <h3>Campus Software</h3>
              <p>Search and download tools compatible with campus workstations.</p>
            </div>
            <div className="admin-booking-filter-bar">
              <label className="admin-booking-filter-field">Search software
                <input 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  placeholder="e.g. Visual Studio" 
                />
              </label>
            </div>
          </div>

          <div className="software-grid">
            {filteredSoftware.map(s => (
              <article key={s.id} className="software-card" onClick={() => setSelectedSoftware(s)} style={{ cursor: 'pointer' }}>
                <div className="software-card-icon">{s.emoji}</div>
                <div>
                  <h4>{s.name}</h4>
                  <span className="session-tag">{s.category}</span>
                </div>
                <div className="helper-text">Version {s.version}</div>
                <button className="solid-btn" style={{ width: '100%' }}>Download</button>
              </article>
            ))}
            {filteredSoftware.length === 0 && (
              <p className="helper-text" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
                No software found matching your search.
              </p>
            )}
          </div>
        </section>

        {selectedSoftware && createPortal(
          <div className="admin-booking-modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedSoftware(null)}>
            <aside className="admin-booking-detail-modal" style={{ maxWidth: '400px', textAlign: 'center' }}>
              <div className="admin-booking-modal-head">
                <div>
                  <p className="student-modern-section-label">Software Details</p>
                  <h3>{selectedSoftware.name}</h3>
                </div>
                <button className="ghost-btn" onClick={() => setSelectedSoftware(null)}>Close</button>
              </div>

              <div style={{ padding: '20px 0' }}>
                <div className="software-card-icon" style={{ width: '80px', height: '80px', fontSize: '2.5rem', marginBottom: '16px' }}>
                  {selectedSoftware.emoji}
                </div>
                <span className="session-tag" style={{ background: '#dbeafe', color: '#1e40af', fontSize: '0.8rem' }}>
                  {selectedSoftware.category}
                </span>
                <p className="helper-text" style={{ marginTop: '12px' }}>
                  Stable Version: <strong>{selectedSoftware.version}</strong>
                </p>
                <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '10px' }}>
                  Certified for use on all campus workstations and personal laptops.
                </p>
              </div>
              
              <div style={{ display: 'grid', gap: '10px' }}>
                <button className="solid-btn" style={{ width: '100%' }}>Download Installer</button>
                <button className="ghost-btn" onClick={() => setSelectedSoftware(null)}>Back to Library</button>
              </div>
            </aside>
          </div>,
          document.body
        )}
      </div>
    </PortalLayout>
  );
}

export default SoftwareHub;
