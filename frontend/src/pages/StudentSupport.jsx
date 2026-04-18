import PortalLayout from "../components/PortalLayout";

function StudentSupport() {
  return (
    <PortalLayout
      title="Student Support"
      subtitle="Raise incident tickets, upload attachments, and track technician updates from this support portal."
    >
      <article className="metric-card">
        <h3>Support Center</h3>
        <p>This page is ready for your Member 3 implementation.</p>
        <p>Next, we can add:</p>
        <ul className="list-clean">
          <li>Create incident ticket form</li>
          <li>File attachment upload</li>
          <li>Technician update timeline</li>
        </ul>
      </article>
    </PortalLayout>
  );
}

export default StudentSupport;
