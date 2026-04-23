import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import PortalLayout from "../components/PortalLayout";
import { readApiError } from "../services/api";
import { fetchTechnicianSupportTickets } from "../services/support";
import "./SupportModule.css";

function TechnicianTicketManagement() {
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
        ticket.userName,
        ticket.userEmail,
        ticket.title,
        ticket.category,
        ticket.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [tickets, statusFilter, searchText]);

  return (
    <PortalLayout
      title="Technician Ticket Workspace"
      subtitle="Handle tickets assigned to you, move them through the support lifecycle, and leave resolution notes."
      pageClassName="support-module-page"
      heroClassName="support-module-hero support-module-hero-detail"
      contentCardClassName="support-module-surface"
    >
      <div className="support-module-stack">
        {error ? <p className="support-inline-alert error-text">{error}</p> : null}

        <section className="support-overview-band support-tech-overview">
          <div className="support-overview-copy">
            <span className="support-eyebrow">Technician Queue</span>
            <h3>Focus on the tickets assigned to you and move them cleanly through resolution.</h3>
            <p>
              Review the student request, add progress updates, and leave a clear resolution note
              before marking work complete.
            </p>
          </div>
          <div className="support-overview-meta">
            <div className="support-overview-chip">
              <strong>{loading ? "--" : counts.total}</strong>
              <span>tickets owned by you</span>
            </div>
            <div className="support-overview-chip">
              <strong>{loading ? "--" : counts.inProgress}</strong>
              <span>currently active</span>
            </div>
          </div>
        </section>

        <section className="stats-grid support-stats-grid">
          <article className="metric-card support-metric-card">
            <h3>Total</h3>
            <p className="metric-number">{loading ? "--" : counts.total}</p>
            <p className="helper-text">Assigned tickets</p>
          </article>
          <article className="metric-card support-metric-card">
            <h3>Open</h3>
            <p className="metric-number">{loading ? "--" : counts.open}</p>
            <p className="helper-text">Waiting to start</p>
          </article>
          <article className="metric-card support-metric-card">
            <h3>In Progress</h3>
            <p className="metric-number">{loading ? "--" : counts.inProgress}</p>
            <p className="helper-text">Currently being worked on</p>
          </article>
          <article className="metric-card support-metric-card">
            <h3>Resolved</h3>
            <p className="metric-number">{loading ? "--" : counts.resolved}</p>
            <p className="helper-text">Marked complete</p>
          </article>
        </section>

        {loading ? <p className="helper-text">Loading assigned tickets...</p> : null}

        <section className="support-filter-bar support-filter-bar-slim">
          <label className="support-filter-field" htmlFor="technician-ticket-search">
            Search queue
            <input
              id="technician-ticket-search"
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search by student, ticket, category, or status"
            />
          </label>

          <label className="support-filter-field" htmlFor="technician-status-filter">
            Status
            <select
              id="technician-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">All statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </label>

          <span className="support-count-pill support-count-pill-inline">
            {loading ? "--" : visibleTickets.length} visible of {loading ? "--" : counts.total}
          </span>
        </section>

        <div className="table-wrap support-ticket-table-wrap">
          <table className="support-ticket-table support-tech-ticket-table">
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
              {visibleTickets.map((ticket) => {
                const statusKey = (ticket.status || "").toLowerCase().replace(/\s+/g, "-");

                return (
                  <tr key={ticket.id}>
                    <td className="support-ticket-table-id">{ticket.ticketNumber || ticket.id}</td>
                    <td>
                      <div className="support-ticket-table-subject">
                        <strong>{ticket.userName}</strong>
                        <span className="helper-text">{ticket.userEmail}</span>
                      </div>
                    </td>
                    <td>
                      <div className="support-ticket-table-subject">
                        <strong>{ticket.title}</strong>
                        <span className="helper-text">{ticket.category}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge support-status-badge ${statusKey}`}>{ticket.status}</span>
                    </td>
                    <td>{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : "-"}</td>
                    <td>
                      <Link className="ghost-btn support-table-action" to={`/technician/tickets/${ticket.id}`}>
                        Open Ticket
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && tickets.length > 0 && !visibleTickets.length ? (
          <article className="support-empty-state">
            <div className="support-empty-icon" aria-hidden="true">0</div>
            <h4>No assigned tickets match this filter</h4>
            <p className="helper-text">Try changing the status filter or clearing the search text.</p>
          </article>
        ) : null}

        {!loading && !tickets.length ? (
          <article className="support-empty-state">
            <div className="support-empty-icon" aria-hidden="true">!</div>
            <h4>No assigned tickets</h4>
            <p className="helper-text">You currently do not have any tickets assigned.</p>
          </article>
        ) : null}
      </div>
    </PortalLayout>
  );
}

export default TechnicianTicketManagement;
