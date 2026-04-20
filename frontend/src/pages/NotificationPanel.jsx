import { useEffect, useState } from "react";

import PortalLayout from "../components/PortalLayout";
import { readApiError } from "../services/api";
import { fetchMyNotifications } from "../services/notifications";

function NotificationPanel() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <PortalLayout
      title="Notification Panel"
      subtitle="Stay updated with lending reminders and reservation updates."
    >
      {error ? <p className="error-text">{error}</p> : null}

      <ul className="list-clean">
        {loading ? <li>Loading notifications...</li> : null}
        {!loading && notifications.length === 0 ? <li>No notifications yet.</li> : null}
        {!loading
          ? notifications.map((note) => (
            <li key={note.id}>
              <strong>{note.title}</strong>
              <span>{note.message}</span>
            </li>
          ))
          : null}
      </ul>
    </PortalLayout>
  );
}

export default NotificationPanel;
