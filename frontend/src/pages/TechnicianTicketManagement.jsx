import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import PortalLayout from "../components/PortalLayout";
import { readApiError } from "../services/api";
import { fetchTechnicianSupportTickets } from "../services/support";

function TechnicianTicketManagement() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchTechnicianSupportTickets();
        if (!active) {
          return;
        }

        setTickets(data);
      } catch (err) {
        if (active) {
          setError(readApiError(err));
          setTickets([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(() => {
    const summary = { total: tickets.length, open: 0, inProgress: 0, resolved: 0 };
    tickets.forEach((ticket) => {
      if (ticket.status === "Open") summary.open += 1;
      if (ticket.status === "In Progress") summary.inProgress += 1;
      if (ticket.status === "Resolved") summary.resolved += 1;
    });
    return summary;
  }, [tickets]);

  return (
    <PortalLayout
      title="Technician Ticket Workspace"
      subtitle="Handle tickets assigned to you, move them through the support lifecycle, and leave resolution notes."
    >
      {error ? <p className="error-text">{error}</p> : null}

      <section className="stats-grid">
        <article className="metric-card">
          <h3>Total</h3>
          <p className="metric-number">{loading ? "--" : counts.total}</p>
          <p className="helper-text">Assigned tickets</p>
        </article>
        <article className="metric-card">
          <h3>Open</h3>
          <p className="metric-number">{loading ? "--" : counts.open}</p>
          <p className="helper-text">Waiting to start</p>
        </article>
        <article className="metric-card">
          <h3>In Progress</h3>
          <p className="metric-number">{loading ? "--" : counts.inProgress}</p>
          <p className="helper-text">Currently being worked on</p>
        </article>
        <article className="metric-card">
          <h3>Resolved</h3>
          <p className="metric-number">{loading ? "--" : counts.resolved}</p>
          <p className="helper-text">Marked complete</p>
        </article>
      </section>

      {loading ? <p className="helper-text" style={{ marginTop: "12px" }}>Loading assigned tickets...</p> : null}

      <div className="table-wrap" style={{ marginTop: "18px" }}>
        <table>
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Student</th>
              <th>Title</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => {
              const statusKey = (ticket.status || "").toLowerCase().replace(/\s+/g, "-");

              return (
                <tr key={ticket.id}>
                  <td>{ticket.ticketNumber || ticket.id}</td>
                  <td>
                    <strong>{ticket.userName}</strong>
                    <p className="helper-text">{ticket.userEmail}</p>
                  </td>
                  <td>{ticket.title}</td>
                  <td>
                    <span className={`status-badge support-status-badge ${statusKey}`}>{ticket.status}</span>
                  </td>
                  <td>{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : "-"}</td>
                  <td>
                    <Link className="ghost-btn" to={`/technician/tickets/${ticket.id}`}>
                      View / Update
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!loading && !tickets.length ? (
        <article className="metric-card" style={{ marginTop: "18px" }}>
          <h3>No assigned tickets</h3>
          <p className="helper-text">You currently do not have any tickets assigned.</p>
        </article>
      ) : null}
    </PortalLayout>
  );
}

export default TechnicianTicketManagement;
