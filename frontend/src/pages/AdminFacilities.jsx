import PortalLayout from "../components/PortalLayout";

const facilities = [
  {
    name: "Computer Lab A",
    location: "Main Building, Floor 2",
    type: "Lab",
    status: "Available",
  },
  {
    name: "Lecture Hall 03",
    location: "Academic Block, Floor 1",
    type: "Lecture Hall",
    status: "Booked",
  },
  {
    name: "Library Room 02",
    location: "Library, Floor 3",
    type: "Meeting Room",
    status: "Maintenance",
  },
];

const bookingRequests = [
  {
    requester: "Jane Student",
    facility: "Computer Lab A",
    slot: "2026-04-21 | 09:00 - 11:00",
    status: "Pending",
  },
  {
    requester: "Nimal Perera",
    facility: "Lecture Hall 03",
    slot: "2026-04-23 | 13:00 - 15:00",
    status: "Pending",
  },
];

const usageReports = [
  {
    label: "Total Facilities",
    value: "12",
  },
  {
    label: "Active Bookings",
    value: "27",
  },
  {
    label: "Maintenance Cases",
    value: "03",
  },
];

function AdminFacilities() {
  return (
    <PortalLayout
      title="Admin Facilities"
      subtitle="Manage facilities, review booking requests, and monitor usage from one admin workspace."
    >
      <section className="stats-grid">
        {usageReports.map((item) => (
          <article key={item.label} className="metric-card">
            <h3>{item.label}</h3>
            <p className="metric-number">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="card admin-facilities-section">
        <div className="student-modern-card-head">
          <div>
            <p className="student-modern-section-label">Facility Management</p>
            <h3>Manage Facilities</h3>
          </div>
        </div>

        <div className="student-facility-action-list">
          <button className="solid-btn" type="button">Add Facility</button>
          <button className="ghost-btn" type="button">Update Facility</button>
          <button className="ghost-btn" type="button">Delete Facility</button>
          <button className="ghost-btn" type="button">Change Status</button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Facility</th>
                <th>Location</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map((facility) => (
                <tr key={facility.name}>
                  <td>{facility.name}</td>
                  <td>{facility.location}</td>
                  <td>{facility.type}</td>
                  <td>{facility.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card admin-facilities-section">
        <div className="student-modern-card-head">
          <div>
            <p className="student-modern-section-label">Booking Requests</p>
            <h3>Approve or Reject Requests</h3>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Requester</th>
                <th>Facility</th>
                <th>Slot</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookingRequests.map((request) => (
                <tr key={`${request.requester}-${request.facility}-${request.slot}`}>
                  <td>{request.requester}</td>
                  <td>{request.facility}</td>
                  <td>{request.slot}</td>
                  <td>{request.status}</td>
                  <td className="admin-facilities-actions">
                    <button className="solid-btn" type="button">Approve</button>
                    <button className="ghost-btn" type="button">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card admin-facilities-section">
        <div className="student-modern-card-head">
          <div>
            <p className="student-modern-section-label">Reports</p>
            <h3>Usage Reports</h3>
          </div>
        </div>

        <ul className="list-clean">
          <li>
            <span>Most-used facility this month</span>
            <strong>Lecture Hall 03</strong>
          </li>
          <li>
            <span>Peak booking window</span>
            <strong>10:00 AM - 12:00 PM</strong>
          </li>
          <li>
            <span>Facilities under maintenance</span>
            <strong>3 spaces currently flagged</strong>
          </li>
        </ul>
      </section>
    </PortalLayout>
  );
}

export default AdminFacilities;
