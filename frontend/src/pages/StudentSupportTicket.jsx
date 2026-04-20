import { Link, useParams } from "react-router-dom";

import PortalLayout from "../components/PortalLayout";

const mockTickets = [
  {
    id: "TCK-1001",
    title: "Cannot borrow e-book",
    category: "Borrowing",
    description: "The borrow button does not work when I try to borrow the e-book from my account.",
    priority: "High",
    status: "Open",
    date: "2026-04-17",
  },
  {
    id: "TCK-1002",
    title: "Login error on mobile",
    category: "Technical",
    description: "The mobile app shows an error after entering my email and password.",
    priority: "Medium",
    status: "In Progress",
    date: "2026-04-16",
  },
  {
    id: "TCK-1003",
    title: "Need profile email correction",
    category: "Account",
    description: "My profile email needs to be updated to the new university email address.",
    priority: "Low",
    status: "Resolved",
    date: "2026-04-14",
  },
  {
    id: "TCK-1004",
    title: "Reservation not showing",
    category: "Technical",
    description: "A book reservation I placed is not visible in my support and activity history.",
    priority: "Medium",
    status: "Open",
    date: "2026-04-13",
  },
  {
    id: "TCK-1005",
    title: "Fine amount clarification",
    category: "Other",
    description: "I want to confirm why the fine amount on my account changed.",
    priority: "Low",
    status: "Resolved",
    date: "2026-04-12",
  },
];

function StudentSupportTicket() {
  const { id } = useParams();
  const ticket = mockTickets.find((item) => item.id === id);

  return (
    <PortalLayout
      title="Support Ticket Details"
      subtitle="This is a simple mock page for viewing one support request."
    >
      <div className="cta-row" style={{ marginBottom: "14px" }}>
        <Link className="ghost-btn" to="/student/support">
          Back to Support
        </Link>
      </div>

      {ticket ? (
        <article className="metric-card">
          <h3>{ticket.title}</h3>
          <p><strong>Ticket ID:</strong> {ticket.id}</p>
          <p><strong>Category:</strong> {ticket.category}</p>
          <p><strong>Description:</strong> {ticket.description}</p>
          <p><strong>Priority:</strong> {ticket.priority}</p>
          <p><strong>Status:</strong> {ticket.status}</p>
          <p><strong>Date:</strong> {ticket.date}</p>
        </article>
      ) : (
        <article className="metric-card">
          <h3>Ticket not found</h3>
          <p className="helper-text">We could not find a mock ticket for this ID.</p>
        </article>
      )}
    </PortalLayout>
  );
}

export default StudentSupportTicket;
