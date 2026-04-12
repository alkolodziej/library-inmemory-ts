import { useState } from "react";
import type { Book } from "../../../../../shared/src/models";

type BookCardProps = {
  book: Book;
  onEdit?: (book: Book) => void;
  onDelete?: (book: Book) => void;
};

export function BookCard({ book, onEdit, onDelete }: BookCardProps) {
  const isAvailable = book.availableCopies > 0;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteConfirm = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      await onDelete(book);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Błąd usuwania");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <article className="module-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ margin: "0 0 0.25rem 0" }}>{book.title}</h3>
            <p style={{ margin: 0, color: "oklch(0.6 0 0)" }}>{book.authors.join(", ")}</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => onEdit && onEdit(book)}
              title="Edytuj"
              style={{ cursor: "pointer", background: "none", border: "1px solid oklch(0.9 0 0)", borderRadius: "8px", padding: "4px 8px", fontSize: "0.75rem" }}
            >
              ✏️
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              title="Usuń"
              style={{ cursor: "pointer", background: "none", border: "1px solid oklch(0.85 0.05 25)", borderRadius: "8px", padding: "4px 8px", fontSize: "0.75rem", color: "oklch(0.5 0.2 25)" }}
            >
              🗑️
            </button>
          </div>
        </header>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {book.categories.map((c: string) => (
            <span
              key={c}
              style={{
                background: "oklch(0.95 0 0)",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "0.75rem"
              }}
            >
              {c}
            </span>
          ))}
        </div>

        <footer style={{
          marginTop: "auto",
          paddingTop: "1rem",
          borderTop: "1px solid oklch(0.9 0 0)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: isAvailable ? "oklch(0.6 0.2 150)" : "oklch(0.6 0.2 25)"
            }} />
            <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
              {isAvailable ? `${book.availableCopies} / ${book.totalCopies} szt.` : "Brak egzemplarzy"}
            </span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "oklch(0.6 0 0)" }}>ISBN: {book.isbn}</span>
        </footer>
      </article>

      {/* Confirmation dialog */}
      {confirmOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 2000
        }}>
          <div className="module-card" style={{ maxWidth: "400px", width: "100%" }}>
            <h3 style={{ marginTop: 0 }}>Usuń książkę</h3>
            <p style={{ margin: "0 0 1rem" }}>
              Czy na pewno chcesz usunąć <strong>„{book.title}"</strong>?
            </p>

            {deleteError && (
              <div style={{ padding: "0.5rem", backgroundColor: "oklch(0.95 0.05 25)", color: "oklch(0.4 0.2 25)", borderRadius: "0.4rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
                ⚠️ {deleteError}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                onClick={() => { setConfirmOpen(false); setDeleteError(""); }}
                disabled={isDeleting}
                style={{ padding: "0.5rem 1rem", border: "1px solid #ccc", background: "transparent", borderRadius: "0.5rem", cursor: "pointer" }}
              >
                Anuluj
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                style={{ padding: "0.5rem 1rem", background: "oklch(0.55 0.2 25)", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}
              >
                {isDeleting ? "Usuwanie..." : "Usuń"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
