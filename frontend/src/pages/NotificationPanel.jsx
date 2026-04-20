import { useEffect, useState } from "react";

import PortalLayout from "../components/PortalLayout";
import { readApiError } from "../services/api";
import { fetchMyNotifications } from "../services/notifications";

function NotificationPanel() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setError("");
        setLoading(true);
        const data = await fetchMyNotifications();
        setNotifications(data);
      } catch (err) {
        setError(readApiError(err));
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
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
