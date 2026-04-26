import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Link, NavLink } from "react-router-dom";

import PortalLayout from "../components/PortalLayout";
import { readApiError } from "../services/api";
import {
  clearAllNotifications,
  deleteNotification,
  fetchMyNotifications,
  markNotificationAsRead,
} from "../services/notifications";

const CATEGORY_ORDER = [
  "USER_MANAGEMENT",
  "RESOURCE_MANAGEMENT",
  "TICKET_MANAGEMENT",
  "BOOKING_MANAGEMENT",
];

const CATEGORY_META = {
  USER_MANAGEMENT: {
    label: "User Management",
    hint: "Profile updates and account-related requests",
  },
  RESOURCE_MANAGEMENT: {
    label: "Resource Management",
    hint: "Resource and facility-related operations",
  },
  TICKET_MANAGEMENT: {
    label: "Ticket Management",
    hint: "Support and issue ticket updates",
  },
  BOOKING_MANAGEMENT: {
    label: "Booking Management",
    hint: "Booking and reservation request updates",
  },
};

const normalizeCategory = (value, title = "", message = "") => {
  const raw = (value || "").toUpperCase();
  if (CATEGORY_ORDER.includes(raw)) {
    return raw;
  }

  const text = `${title} ${message}`.toLowerCase();
  if (text.includes("profile") || text.includes("user") || text.includes("account")) {
    return "USER_MANAGEMENT";
  }
  if (text.includes("ticket") || text.includes("support") || text.includes("issue")) {
    return "TICKET_MANAGEMENT";
  }
  if (text.includes("booking") || text.includes("reservation") || text.includes("slot")) {
    return "BOOKING_MANAGEMENT";
  }
  return "RESOURCE_MANAGEMENT";
};

function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [activeCategory, setActiveCategory] = useState("USER_MANAGEMENT");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let firstLoad = true;

    const load = async () => {
      try {
        if (firstLoad) {
          setLoading(true);
        }
        setError("");
        const data = await fetchMyNotifications();
        if (!active) {
          return;
        }

        const normalized = data.map((note) => ({
          ...note,
          category: normalizeCategory(note.category, note.title, note.message),
        }));
        setNotifications(normalized);
        firstLoad = false;
      } catch (err) {
        if (active) {
          setError(readApiError(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    const intervalId = window.setInterval(load, 15000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const counts = useMemo(() => {
    const base = {
      USER_MANAGEMENT: 0,
      RESOURCE_MANAGEMENT: 0,
      TICKET_MANAGEMENT: 0,
      BOOKING_MANAGEMENT: 0,
    };

    notifications.forEach((note) => {
      base[note.category] = (base[note.category] || 0) + 1;
    });

    return base;
  }, [notifications]);

  const filteredNotifications = useMemo(
    () => notifications.filter((note) => note.category === activeCategory),
    [notifications, activeCategory],
  );

  const searchedNotifications = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) {
      return filteredNotifications;
    }

    return filteredNotifications.filter((note) => {
      const createdAtText = note.createdAt ? new Date(note.createdAt).toLocaleString() : "";
      return `${note.title} ${note.message} ${createdAtText}`.toLowerCase().includes(q);
    });
  }, [filteredNotifications, searchTerm]);

  const onMarkRead = async (id) => {
    setBusy(true);
    setError("");
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id) => {
    setBusy(true);
    setError("");
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const onClearAll = async () => {
    if (!notifications.length) {
      return;
    }

    setBusy(true);
    setError("");
    try {
      await clearAllNotifications();
      setNotifications([]);
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const onClearCategory = async () => {
    if (!filteredNotifications.length) {
      return;
    }

    setBusy(true);
    setError("");
    try {
      await Promise.all(filteredNotifications.map((note) => deleteNotification(note.id)));
      setNotifications((prev) => prev.filter((item) => item.category !== activeCategory));
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const onResetSearch = () => {
    setSearchTerm("");
  };

  const onExportPdf = () => {
    if (!searchedNotifications.length) {
      setError("No notifications available to export in this view.");
      return;
    }

    const activeLabel = CATEGORY_META[activeCategory]?.label || "Notifications";

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // 1. Header Branded Background
    doc.setFillColor(31, 71, 140); // NNIC Deep Blue
    doc.rect(0, 0, pageWidth, 80, 'F');

    // 2. Official Logo Image
    try {
      doc.addImage("/nnic-logo-icon.png", "PNG", 40, 10, 60, 60);
    } catch (e) {
      // Fallback
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(40, 15, 50, 50, 10, 10, 'F');
      doc.setTextColor(31, 71, 140);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("N", 54, 48);
    }
    
    // 3. Title & Metadata
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("NNIC SMART CAMPUS", 115, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${activeLabel.toUpperCase()} ACTIVITY LOG | EXPORTED: ${new Date().toLocaleString()}`, 115, 55);

    // 4. Notifications Table
    autoTable(doc, {
      startY: 100,
      head: [["Title", "Message", "Timestamp", "Status"]],
      body: searchedNotifications.map(n => [
        n.title, 
        n.message, 
        n.createdAt ? new Date(n.createdAt).toLocaleString() : "-", 
        n.read ? "Processed" : "New"
      ]),
      headStyles: { 
        fillColor: [45, 55, 72], // Slate 700
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { 
        fontSize: 9,
        textColor: [30, 41, 59], // Slate 800
        cellPadding: 8
      },
      columnStyles: {
        0: { cellWidth: 150 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 120 },
        3: { cellWidth: 80 }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Slate 50
      },
      margin: { left: 40, right: 40 },
      theme: 'grid'
    });

    // 5. Footer
    const footerY = doc.internal.pageSize.getHeight() - 30;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`NNIC Smart Campus Administrative Record | Category: ${activeLabel} | Search Context: ${searchTerm || "None"}`, 40, footerY);
    doc.text(`Total Notifications: ${searchedNotifications.length}`, pageWidth - 140, footerY);

    const fileCategory = activeLabel.toLowerCase().replace(/\s+/g, "-");
    doc.save(`nnic-${fileCategory}-log-${new Date().getTime()}.pdf`);
  };

  const activeMeta = CATEGORY_META[activeCategory];

  useEffect(() => {
    setSearchTerm("");
  }, [activeCategory]);

  return (
    <PortalLayout
      title="Admin Notification Management"
      subtitle="Central admin inbox grouped by User, Resource, Ticket, and Booking management categories."
      loading={loading}
    >
      {error ? <p className="error-text">{error}</p> : null}

      <section className="admin-vision-layout admin-user-vision-layout">
        <aside className="admin-vision-sidebar">
          <div className="admin-vision-brand">
            <img src="/nnic-logo-icon.png" alt="NNIC logo" className="admin-vision-brand-logo" />
          </div>
          <nav className="admin-vision-nav" aria-label="Admin quick menu">
            <NavLink to="/admin/profile" className="admin-vision-link">
              Dashboard
            </NavLink>
            <NavLink to="/admin/users" className="admin-vision-link">
              User Management
            </NavLink>
            <NavLink to="/admin/facilities" className="admin-vision-link">
              Facilities
            </NavLink>
            <NavLink to="/admin/tickets" className="admin-vision-link">
              Ticket Management
            </NavLink>
            <NavLink to="/admin/bookings" className="admin-vision-link">
              Booking Management
            </NavLink>
            <NavLink to="/admin/notifications" className="admin-vision-link">
              Notifications
            </NavLink>
          </nav>
        </aside>

        <div className="admin-vision-main admin-user-vision-main">
          <section className="admin-user-panel">
            <div className="admin-section-head">
              <div>
                <p className="student-modern-section-label">Notification Categories</p>
                <h3 className="admin-section-title">Management Overview</h3>
              </div>
              <div className="admin-notification-toolbar-actions">
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={onClearCategory}
                  disabled={busy || !filteredNotifications.length}
                >
                  Clear Category
                </button>
                <button
                  className="ghost-btn danger-btn"
                  type="button"
                  onClick={onClearAll}
                  disabled={busy || !notifications.length}
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="admin-notification-category-grid">
              {CATEGORY_ORDER.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`admin-notification-category-card${activeCategory === category ? " admin-notification-category-card-active" : ""}`}
                  onClick={() => setActiveCategory(category)}
                >
                  <strong>{CATEGORY_META[category].label}</strong>
                  <span>{CATEGORY_META[category].hint}</span>
                  <em>{counts[category] || 0} notifications</em>
                </button>
              ))}
            </div>
          </section>

          <section className="admin-user-panel">
            <div className="admin-user-list-head">
              <h3>{activeMeta.label}</h3>
              <p className="helper-text">{activeMeta.hint}</p>
            </div>

            <form
              className="admin-user-toolbar"
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <label>
                Search
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={`Search ${activeMeta.label.toLowerCase()} notifications`}
                />
              </label>

              <div className="admin-user-toolbar-actions">
                <button className="ghost-btn admin-action-btn" type="button" onClick={onResetSearch} disabled={busy}>
                  Reset
                </button>
                <button
                  className="ghost-btn admin-action-btn"
                  type="button"
                  onClick={onExportPdf}
                  disabled={busy || !searchedNotifications.length}
                >
                  Download PDF
                </button>
              </div>
            </form>

            <ul className="admin-notification-list-clean">
              {!loading && searchedNotifications.length === 0 ? (
                <li className="admin-notification-empty">
                  {searchTerm.trim() ? "No matching notifications found." : "No notifications in this category."}
                </li>
              ) : null}

              {searchedNotifications.map((note) => (
                <li key={note.id} className={`admin-notification-item${note.read ? "" : " admin-notification-item-unread"}`}>
                  <div className="admin-notification-copy">
                    {note.actionUrl ? (
                      <strong><Link to={note.actionUrl} className="notification-link">{note.title}</Link></strong>
                    ) : (
                      <strong>{note.title}</strong>
                    )}
                    <span>{note.message}</span>
                    <small>{note.createdAt ? new Date(note.createdAt).toLocaleString() : ""}</small>
                  </div>
                  <div className="admin-notification-item-actions">
                    {!note.read ? (
                      <button className="ghost-btn" type="button" onClick={() => onMarkRead(note.id)} disabled={busy}>
                        Mark as read
                      </button>
                    ) : null}
                    <button className="ghost-btn danger-btn" type="button" onClick={() => onDelete(note.id)} disabled={busy}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </PortalLayout>
  );
}

export default AdminNotifications;
