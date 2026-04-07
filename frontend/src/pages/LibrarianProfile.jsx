import { useState } from "react";
import PortalLayout from "../components/PortalLayout";

const initialBooks = [
  { code: "LB-101", title: "Advanced Database Systems", author: "C. Date", status: "Available" },
  { code: "LB-102", title: "Library Information Networks", author: "A. Wood", status: "Borrowed" },
  { code: "LB-103", title: "UX Research Methods", author: "K. Morgan", status: "Available" },
];

function LibrarianProfile() {
  const [books, setBooks] = useState(initialBooks);
  const [draft, setDraft] = useState({ code: "", title: "", author: "" });

  const onAddBook = (event) => {
    event.preventDefault();
    if (!draft.code || !draft.title || !draft.author) return;

    setBooks((prev) => [
      {
        code: draft.code,
        title: draft.title,
        author: draft.author,
        status: "Available",
      },
      ...prev,
    ]);
    setDraft({ code: "", title: "", author: "" });
  };

  return (
    <PortalLayout
      title="Librarian Workspace"
      subtitle="Book listing and intake interface ready for inventory operations."
    >
      <div className="profile-grid">
        <article className="metric-card">
          <h3>Existing Book List</h3>
          <ul className="list-clean">
            {books.map((book) => (
              <li key={book.code}>
                <span>{book.title} ({book.code})</span>
                <span>{book.status}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="metric-card">
          <h3>Add Book</h3>
          <form className="form-grid" onSubmit={onAddBook}>
            <label>
              Book Code
              <input
                type="text"
                value={draft.code}
                onChange={(event) => setDraft((prev) => ({ ...prev, code: event.target.value }))}
              />
            </label>
            <label>
              Title
              <input
                type="text"
                value={draft.title}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
              />
            </label>
            <label>
              Author
              <input
                type="text"
                value={draft.author}
                onChange={(event) => setDraft((prev) => ({ ...prev, author: event.target.value }))}
              />
            </label>
            <button className="solid-btn full-width" type="submit">
              Add to List
            </button>
          </form>
        </article>
      </div>
    </PortalLayout>
  );
}

export default LibrarianProfile;
