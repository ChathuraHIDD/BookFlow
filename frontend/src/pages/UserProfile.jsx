import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/useAuth";
import { formatEnumText, normalizeRole, roleLabel } from "../utils/role";

const sampleBorrowedBooks = [
  { id: "BK-1002", title: "Modern Information Systems", dueDate: "2026-04-09" },
  { id: "BK-1037", title: "Digital Library Architecture", dueDate: "2026-04-17" },
  { id: "BK-1091", title: "Software Quality Assurance", dueDate: "2026-04-24" },
];

function UserProfile() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);

  return (
    <PortalLayout
      title={`${roleLabel(role)} Profile`}
      subtitle="Your account information and borrowing activity are loaded from your authenticated profile."
    >
      <div className="profile-grid">
        <article className="metric-card">
          <h3>Member Details</h3>
          <p><strong>Name:</strong> {user?.fullName}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Telephone:</strong> {user?.telephone || "-"}</p>
          <p><strong>Center:</strong> {formatEnumText(user?.center)}</p>
          <p><strong>Degree Program:</strong> {formatEnumText(user?.degreeProgram)}</p>
          {role === "student" ? (
            <>
              <p><strong>Campus Year:</strong> {formatEnumText(user?.campusYear)}</p>
              <p><strong>Semester:</strong> {user?.semester || "-"}</p>
            </>
          ) : null}
        </article>

        <article className="metric-card">
          <h3>Borrowed Books</h3>
          <ul className="list-clean">
            {sampleBorrowedBooks.map((book) => (
              <li key={book.id}>
                <span>{book.title}</span>
                <span>{book.dueDate}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </PortalLayout>
  );
}

export default UserProfile;
