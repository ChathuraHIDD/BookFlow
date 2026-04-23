import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PortalLayout from "../components/PortalLayout";
import { readApiError } from "../services/api";
import { fetchMySupportTickets } from "../services/support";
import "./SupportModule.css";

function StudentSupport() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchText, setSearchText] = useState("");

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

  const visibleTickets = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    return tickets.filter((ticket) => {
      if (statusFilter !== "ALL" && ticket.status !== statusFilter) {
        return false;
      }

      if (!q) {
        return true;
      }

      const searchable = [
        ticket.ticketNumber,
        ticket.title,
        ticket.category,
        ticket.status,
        ticket.locationResource,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [tickets, statusFilter, searchText]);

  return (
    <PortalLayout
      title="Student Support"
      subtitle="Track your support requests and create new incident tickets from one place."
      pageClassName="support-module-page"
      heroClassName="support-module-hero"
      contentCardClassName="support-module-surface"
    >
      <div className="support-module-stack">
        {error ? <p className="support-inline-alert error-text">{error}</p> : null}

        <section className="support-overview-band">
          <div className="support-overview-copy">
            <span className="support-eyebrow">Support Center</span>
            <h3>Keep every issue, screenshot, and follow-up in one place.</h3>
            <p>
              Start a new ticket, monitor status changes, and return to previous
              requests without jumping between pages or email threads.
            </p>
          </div>
          <div className="support-overview-meta">
            <div className="support-overview-chip">
              <strong>{loading ? "--" : counts.total}</strong>
              <span>requests tracked</span>
            </div>
            <Link className="solid-btn support-raise-cta" to="/student/support/raise">
              Raise New Ticket
            </Link>
          </div>
        </section>

        <section className="stats-grid support-stats-grid">
          <article className="metric-card support-metric-card">
            <h3>Total</h3>
            <p className="metric-number">{loading ? "--" : counts.total}</p>
            <p className="helper-text">All support tickets</p>
          </article>

          <article className="metric-card support-metric-card">
            <h3>Open</h3>
            <p className="metric-number">{loading ? "--" : counts.open}</p>
            <p className="helper-text">Waiting for first update</p>
          </article>

          <article className="metric-card support-metric-card">
            <h3>In Progress</h3>
            <p className="metric-number">{loading ? "--" : counts.inProgress}</p>
            <p className="helper-text">Currently being handled</p>
          </article>

          <article className="metric-card support-metric-card">
            <h3>Resolved</h3>
            <p className="metric-number">{loading ? "--" : counts.resolved}</p>
            <p className="helper-text">Completed requests</p>
          </article>
        </section>

        <section className="card support-ticket-list-card">
          <div className="support-section-heading">
            <div>
              <span className="support-eyebrow">My Queue</span>
              <h3>My Support Requests</h3>
            </div>
            <span className="support-count-pill">
              {loading ? "--" : visibleTickets.length} visible of {loading ? "--" : counts.total}
            </span>
          </div>

          <div className="support-filter-bar">
            <label className="support-filter-field" htmlFor="support-search">
              Search tickets
              <input
                id="support-search"
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search by title, category, status, or ticket id"
              />
            </label>

            <label className="support-filter-field" htmlFor="support-status-filter">
              Status
              <select
                id="support-status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="ALL">All statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </label>
          </div>

          {loading ? <p className="helper-text">Loading support tickets...</p> : null}
          {!loading && !tickets.length ? (
            <div className="support-empty-state">
              <div className="support-empty-icon" aria-hidden="true">?</div>
              <h4>No support tickets yet</h4>
              <p className="helper-text">Raise your first ticket to start tracking updates here.</p>
              <Link className="solid-btn" to="/student/support/raise">
                Raise Ticket
              </Link>
            </div>
          ) : null}

          {!loading && tickets.length > 0 && !visibleTickets.length ? (
            <div className="support-empty-state">
              <div className="support-empty-icon" aria-hidden="true">0</div>
              <h4>No tickets match this filter</h4>
              <p className="helper-text">Try changing the status filter or clearing the search.</p>
            </div>
          ) : null}

          {visibleTickets.length ? (
            <div className="table-wrap support-ticket-table-wrap">
              <table className="support-ticket-table">
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
                  {visibleTickets.map((ticket) => {
                    const statusKey = (ticket.status || "").toLowerCase().replace(/\s+/g, "-");

                    return (
                      <tr key={ticket.id}>
                        <td className="support-ticket-table-id">{ticket.ticketNumber || ticket.id}</td>
                        <td>
                          <div className="support-ticket-table-subject">
                            <strong>{ticket.title}</strong>
                            <span className="helper-text">{ticket.locationResource || "General request"}</span>
                          </div>
                        </td>
                        <td>{ticket.category}</td>
                        <td>
                          <span className={`status-badge support-status-badge ${statusKey}`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td>{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString() : "-"}</td>
                        <td>
                          <button
                            className="ghost-btn support-table-action"
                            type="button"
                            onClick={() => navigate(`/student/support/${ticket.id}`)}
                          >
                            Open Ticket
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </PortalLayout>
  );
}

export default StudentSupport;
