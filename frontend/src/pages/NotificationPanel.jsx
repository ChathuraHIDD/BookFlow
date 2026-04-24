import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PortalLayout from "../components/PortalLayout";
import { readApiError } from "../services/api";
import {
  clearAllNotifications,
  deleteNotification,
  fetchMyNotifications,
  markNotificationAsRead,
} from "../services/notifications";

function NotificationPanel() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let firstLoad = true;

    const loadNotifications = async () => {
      try {
        setError("");
        if (firstLoad) {
          setLoading(true);
        }
        const data = await fetchMyNotifications();
        if (active) {
          setNotifications(data);
        }
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

    loadNotifications();

    const intervalId = window.setInterval(loadNotifications, 15000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const onMarkRead = async (id) => {
    setBusy(true);
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
    try {
      await clearAllNotifications();
      setNotifications([]);
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PortalLayout
      title="Notification Panel"
      subtitle="Stay updated with ticket, booking, and account notifications."
    >
      {error ? <p className="error-text">{error}</p> : null}

      <div className="notification-panel-actions">
        <button className="ghost-btn" type="button" onClick={onClearAll} disabled={busy || !notifications.length}>
          Clear all
        </button>
      </div>

      <ul className="list-clean">
        {loading ? <li>Loading notifications...</li> : null}
        {!loading && notifications.length === 0 ? <li>No notifications yet.</li> : null}
        {!loading
          ? notifications.map((note) => (
            <li key={note.id} className={`notification-panel-item${note.read ? "" : " notification-panel-item-unread"}`}>
              <div className="notification-panel-copy">
                {note.actionUrl ? (
                  <strong><Link to={note.actionUrl} className="notification-link">{note.title}</Link></strong>
                ) : (
                  <strong>{note.title}</strong>
                )}
                <span>{note.message}</span>
              </div>
              <div className="notification-panel-item-actions">
                {!note.read ? (
                  <button className="ghost-btn" type="button" onClick={() => onMarkRead(note.id)} disabled={busy}>
                    Mark as read
                  </button>
                ) : null}
                <button
                  className="ghost-btn danger-btn"
                  type="button"
                  onClick={() => onDelete(note.id)}
                  disabled={busy}
                >
                  Delete
                </button>
              </div>
            </li>
          ))
          : null}
      </ul>
    </PortalLayout>
  );
}

export default NotificationPanel;
