import PortalLayout from "../components/PortalLayout";

const notifications = [
  "Book BK-1002 is due in 3 days.",
  "Reservation confirmed for Data Structures Handbook.",
  "Library workshop: Digital Referencing this Friday.",
];

function NotificationPanel() {
  return (
    <PortalLayout
      title="Notification Panel"
      subtitle="Stay updated with lending reminders and reservation updates."
    >
      <ul className="list-clean">
        {notifications.map((note) => (
          <li key={note}>
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </PortalLayout>
  );
}

export default NotificationPanel;
