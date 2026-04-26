import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PortalLayout from "../components/PortalLayout";
import api, { readApiError } from "../services/api";

function AdminBookingVerification() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        // We'll try to find it in either classroom or resource bookings
        let data = null;
        try {
          const res = await api.get(`/admin/facilities/bookings/${id}`);
          data = res.data;
        } catch (e) {
          const res = await api.get(`/admin/resources/bookings/${id}`);
          data = res.data;
          data.isResource = true;
        }

        setBooking(data);
      } catch (err) {
        setError("Invalid or expired booking pass. Please verify the ID.");
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  return (
    <PortalLayout 
      title="Security Verification" 
      subtitle="Official NNIC Smart Campus Access Control & Verification Portal"
      pageClassName="admin-verify-page"
    >
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
            <p className="helper-text">Authenticating booking pass...</p>
          </div>
        ) : error ? (
          <article className="admin-booking-panel" style={{ textAlign: 'center', border: '2px solid #fee2e2', background: '#fef2f2' }}>
            <span style={{ fontSize: '4rem', display: 'block', marginBottom: '20px' }}>❌</span>
            <h2 style={{ color: '#991b1b', marginBottom: '12px' }}>Verification Failed</h2>
            <p style={{ color: '#b91c1c', marginBottom: '24px' }}>{error}</p>
            <Link to="/admin/bookings" className="solid-btn" style={{ background: '#991b1b' }}>Return to Dashboard</Link>
          </article>
        ) : (
          <article className="admin-booking-panel" style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)',
            border: '1px solid #e2e8f0',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Security Watermark */}
            <div style={{ 
              position: 'absolute', top: '-50px', right: '-50px', fontSize: '10rem', opacity: 0.03, pointerEvents: 'none', transform: 'rotate(-20deg)',
              animation: 'slideIn 1s ease-out'
            }}>VERIFIED</div>

            <style>{`
              @keyframes slideIn { from { transform: translateX(100px) rotate(-20deg); opacity: 0; } to { transform: translateX(0) rotate(-20deg); opacity: 0.03; } }
              @keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
              .animate-pop { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            `}</style>

            <div style={{ textAlign: 'center', marginBottom: '32px' }} className="animate-pop">
              <div style={{ 
                width: '100px', height: '100px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 20px',
                boxShadow: '0 10px 25px rgba(34, 197, 94, 0.4)',
                border: '4px solid white'
              }}>
                <span style={{ color: 'white', fontSize: '3rem' }}>✓</span>
              </div>
              <h2 style={{ color: '#1e293b', fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Access Granted</h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%' }}></span>
                <p style={{ color: '#64748b', margin: 0, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>Secure Identity Verified</p>
              </div>
            </div>

            <div style={{ 
              background: 'rgba(255,255,255,0.8)', 
              borderRadius: '20px', 
              padding: '24px', 
              border: '1px solid #edf2f7',
              display: 'grid',
              gap: '20px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Student Name</label><strong style={{ fontSize: '1.1rem', color: '#1e293b' }}>{booking.requestedByName}</strong></div>
                <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Booking ID</label><strong style={{ fontSize: '1.1rem', color: '#1e293b' }}>#{booking.id.slice(-8).toUpperCase()}</strong></div>
              </div>

              <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Location</label>
                <strong style={{ fontSize: '1.2rem', color: '#1e3a8a' }}>
                  {booking.isResource ? booking.resourceName : `${booking.buildingName} · Room ${booking.roomNumber}`}
                </strong>
                {booking.floorNumber && <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Floor {booking.floorNumber}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Date</label><strong style={{ color: '#334155' }}>{booking.bookingDate}</strong></div>
                <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Time Slot</label><strong style={{ color: '#334155' }}>{booking.startTime} - {booking.endTime}</strong></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Purpose</label><strong style={{ color: '#334155' }}>{booking.purpose || "General"}</strong></div>
                <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Status</label><span className="admin-booking-status-badge admin-booking-status-approved" style={{ padding: '4px 12px' }}>{booking.status}</span></div>
              </div>
            </div>

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <p className="helper-text" style={{ fontStyle: 'italic', marginBottom: '16px' }}>Identity confirmed via NNIC Smart Campus Network Authentication.</p>
              <button className="solid-btn" onClick={() => window.print()} style={{ marginRight: '10px' }}>Print Record</button>
              <Link to="/admin/bookings" className="ghost-btn">Dashboard</Link>
            </div>
          </article>
        )}
      </div>
    </PortalLayout>
  );
}

export default AdminBookingVerification;
