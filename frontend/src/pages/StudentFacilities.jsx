import StudentPortalShell from "../components/StudentPortalShell";

const facilities = [
  {
    name: "Computer Lab A",
    location: "Main Building, Floor 2",
    capacity: 40,
    type: "Lab",
    status: "Available",
    equipment: ["Projector", "PCs", "AC"],
  },
  {
    name: "Lecture Hall 03",
    location: "Academic Block, Floor 1",
    capacity: 120,
    type: "Lecture Hall",
    status: "Booked",
    equipment: ["Projector", "Audio", "AC"],
  },
  {
    name: "Library Room 02",
    location: "Library, Floor 3",
    capacity: 12,
    type: "Meeting Room",
    status: "Maintenance",
    equipment: ["Display", "Whiteboard", "AC"],
  },
];

const bookings = [
  {
    facility: "Computer Lab A",
    date: "2026-04-21",
    slot: "09:00 - 11:00",
    status: "Confirmed",
  },
  {
    facility: "Lecture Hall 03",
    date: "2026-04-23",
    slot: "13:00 - 15:00",
    status: "Pending",
  },
];

const slots = [
  { label: "08:00 - 10:00", state: "Available" },
  { label: "10:00 - 12:00", state: "Booked" },
  { label: "13:00 - 15:00", state: "Available" },
  { label: "15:00 - 17:00", state: "Maintenance" },
];

function StudentFacilities() {
  return (
    <StudentPortalShell activeKey="facilities">
      <section className="student-modern-hero-card student-facilities-hero">
        <div className="student-modern-hero-copy">
          <p className="student-modern-section-label">Facilities</p>
          <h2>Book and manage campus spaces.</h2>
          <p>
            Check facility details, view live availability, submit bookings, and track updates from one place.
          </p>
        </div>
      </section>

      <section className="student-facilities-grid">
        <article className="student-modern-workspace-card student-facilities-wide-card">
          <div className="student-modern-card-head">
            <div>
              <p className="student-modern-section-label">Facilities</p>
              <h3>Facility Details</h3>
            </div>
          </div>

          <div className="student-facility-toolbar">
            <div className="student-facility-search">Search facilities</div>
            <div className="student-facility-filter-row">
              <span>All Types</span>
              <span>All Locations</span>
              <span>All Status</span>
            </div>
          </div>

          <div className="student-facility-detail-grid">
            {facilities.map((facility) => (
              <article key={facility.name} className="student-facility-card">
                <div className="student-facility-card-top">
                  <div>
                    <h4>{facility.name}</h4>
                    <p>{facility.location}</p>
                  </div>
                  <span className={`student-facility-status student-facility-status-${facility.status.toLowerCase()}`}>
                    {facility.status}
                  </span>
                </div>
                <div className="student-facility-meta">
                  <span>{facility.type}</span>
                  <span>{facility.capacity} Seats</span>
                </div>
                <div className="student-facility-equipment">
                  {facility.equipment.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="student-modern-workspace-card">
          <div className="student-modern-card-head">
            <div>
              <p className="student-modern-section-label">Booking</p>
              <h3>Booking System</h3>
            </div>
          </div>

          <div className="student-facility-booking-form">
            <div className="student-facility-field">
              <label>Facility</label>
              <div>Computer Lab A</div>
            </div>
            <div className="student-facility-field">
              <label>Date</label>
              <div>2026-04-21</div>
            </div>
            <div className="student-facility-field">
              <label>Time Slot</label>
              <div>09:00 - 11:00</div>
            </div>
            <div className="student-facility-booking-actions">
              <button className="solid-btn" type="button">Book</button>
              <button className="ghost-btn" type="button">Cancel</button>
            </div>
          </div>

          <div className="student-facility-history">
            <p className="student-modern-section-label">History</p>
            <ul className="list-clean student-modern-mini-list">
              {bookings.map((item) => (
                <li key={`${item.facility}-${item.date}-${item.slot}`}>
                  {item.facility} | {item.date} | {item.slot} | {item.status}
                </li>
              ))}
            </ul>
          </div>
        </article>

        <article className="student-modern-workspace-card">
          <div className="student-modern-card-head">
            <div>
              <p className="student-modern-section-label">Availability</p>
              <h3>Live Availability</h3>
            </div>
          </div>
          <div className="student-facility-slot-grid">
            {slots.map((slot) => (
              <div key={slot.label} className={`student-facility-slot student-facility-slot-${slot.state.toLowerCase()}`}>
                <strong>{slot.label}</strong>
                <span>{slot.state}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </StudentPortalShell>
  );
}

export default StudentFacilities;
