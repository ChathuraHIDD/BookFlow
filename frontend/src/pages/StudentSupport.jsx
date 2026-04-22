import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PortalLayout from "../components/PortalLayout";
import { readApiError } from "../services/api";
import { fetchMySupportTickets } from "../services/support";

function StudentSupport() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchMySupportTickets();
        if (active) {
          setTickets(data);
        }
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
    const summary = {
      total: tickets.length,
      open: 0,
      inProgress: 0,
      resolved: 0,
    };

    tickets.forEach((ticket) => {
      if (ticket.status === "Open") {
        summary.open += 1;
      }
      if (ticket.status === "In Progress") {
        summary.inProgress += 1;
      }
      if (ticket.status === "Resolved") {
        summary.resolved += 1;
      }
    });

    return summary;
  }, [tickets]);

  return (
    <PortalLayout
      title="Student Support"
      subtitle="Track your support requests and create new incident tickets from one place."
    >
      {error ? <p className="error-text">{error}</p> : null}

      <section className="stats-grid">
        <article className="metric-card">
          <h3>Total</h3>
          <p className="metric-number">{loading ? "--" : counts.total}</p>
          <p className="helper-text">All support tickets</p>
        </article>

        <article className="metric-card">
          <h3>Open</h3>
          <p className="metric-number">{loading ? "--" : counts.open}</p>
          <p className="helper-text">Waiting for first update</p>
        </article>

        <article className="metric-card">
          <h3>In Progress</h3>
          <p className="metric-number">{loading ? "--" : counts.inProgress}</p>
          <p className="helper-text">Currently being handled</p>
        </article>

        <article className="metric-card">
          <h3>Resolved</h3>
          <p className="metric-number">{loading ? "--" : counts.resolved}</p>
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
        {loading ? <p className="helper-text" style={{ marginTop: "10px" }}>Loading support tickets...</p> : null}
        {!loading && !tickets.length ? (
          <p className="helper-text" style={{ marginTop: "10px" }}>No support tickets yet. Raise a new one to get started.</p>
        ) : null}
        <div className="table-wrap" style={{ marginTop: "10px" }}>
          <table>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => {
                const statusKey = (ticket.status || "").toLowerCase().replace(/\s+/g, "-");

                return (
                  <tr key={ticket.id}>
                    <td>{ticket.ticketNumber || ticket.id}</td>
                    <td>{ticket.title}</td>
                    <td>{ticket.category}</td>
                    <td>
                      <span className={`status-badge support-status-badge ${statusKey}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td>{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString() : "-"}</td>
                    <td>
                      <button
                        className="ghost-btn"
                        type="button"
                        onClick={() => navigate(`/student/support/${ticket.id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </PortalLayout>
  );
}

export default StudentSupport;
