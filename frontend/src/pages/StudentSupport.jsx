import PortalLayout from "../components/PortalLayout";
import { Link } from "react-router-dom";

function StudentSupport() {
  const mockTickets = [
    {
      id: "TCK-1001",
      subject: "Cannot borrow e-book",
      category: "Borrowing",
      status: "Open",
      updatedAt: "2026-04-17",
    },
    {
      id: "TCK-1002",
      subject: "Login error on mobile",
      category: "Technical",
      status: "In Progress",
      updatedAt: "2026-04-16",
    },
    {
      id: "TCK-1003",
      subject: "Need profile email correction",
      category: "Account",
      status: "Resolved",
      updatedAt: "2026-04-14",
    },
    {
      id: "TCK-1004",
      subject: "Reservation not showing",
      category: "Technical",
      status: "Open",
      updatedAt: "2026-04-13",
    },
    {
      id: "TCK-1005",
      subject: "Fine amount clarification",
      category: "Other",
      status: "Resolved",
      updatedAt: "2026-04-12",
    },
  ];

  const totalCount = mockTickets.length;
  const openCount = mockTickets.filter((ticket) => ticket.status === "Open").length;
  const inProgressCount = mockTickets.filter((ticket) => ticket.status === "In Progress").length;
  const resolvedCount = mockTickets.filter((ticket) => ticket.status === "Resolved").length;

  return (
    <PortalLayout
      title="Student Support"
      subtitle="Track your support requests and create new incident tickets from one place."
    >
      <section className="stats-grid">
        <article className="metric-card">
          <h3>Total</h3>
          <p className="metric-number">{totalCount}</p>
          <p className="helper-text">All support tickets</p>
        </article>

        <article className="metric-card">
          <h3>Open</h3>
          <p className="metric-number">{openCount}</p>
          <p className="helper-text">Waiting for first update</p>
        </article>

        <article className="metric-card">
          <h3>In Progress</h3>
          <p className="metric-number">{inProgressCount}</p>
          <p className="helper-text">Currently being handled</p>
        </article>

        <article className="metric-card">
          <h3>Resolved</h3>
          <p className="metric-number">{resolvedCount}</p>
          <p className="helper-text">Completed requests</p>
        </article>
      </section>

      <div className="cta-row">
        <Link className="solid-btn" to="/student/support/raise">
          Raise New Ticket
        </Link>
      </div>

      <section className="card" style={{ marginTop: "14px" }}>
        <h3>My Support Requests</h3>
        <div className="table-wrap" style={{ marginTop: "10px" }}>
          <table>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Status</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {mockTickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td>{ticket.id}</td>
                  <td>{ticket.subject}</td>
                  <td>{ticket.category}</td>
                  <td>{ticket.status}</td>
                  <td>{ticket.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PortalLayout>
  );
}

export default StudentSupport;
