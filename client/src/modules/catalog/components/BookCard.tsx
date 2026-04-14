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
      <article className="module-card catalog-book-card">
        <header className="catalog-book-head">
          <div>
            <h3 className="catalog-book-title">{book.title}</h3>
            <p className="catalog-book-authors">{book.authors.join(", ")}</p>
          </div>
          <div className="catalog-book-actions">
            <button
              onClick={() => onEdit && onEdit(book)}
              title="Edytuj"
              className="ui-btn ui-btn--compact ui-btn--secondary catalog-action-btn"
            >
              ✏️
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              title="Usuń"
              className="ui-btn ui-btn--compact ui-btn--danger catalog-action-btn is-danger"
            >
              🗑️
            </button>
          </div>
        </header>

        <div className="catalog-tags">
          {book.categories.map((c: string) => (
            <span key={c} className="catalog-tag">
              {c}
            </span>
          ))}
        </div>

        <footer className="catalog-book-foot">
          <div className="catalog-stock">
            <div className={`catalog-dot ${isAvailable ? "is-available" : ""}`} />
            <span>
              {isAvailable ? `${book.availableCopies} / ${book.totalCopies} szt.` : "Brak egzemplarzy"}
            </span>
          </div>
          <span className="catalog-isbn">ISBN: {book.isbn}</span>
        </footer>
      </article>

      {/* Confirmation dialog */}
      {confirmOpen && (
        <div className="catalog-dialog-backdrop">
          <div className="module-card catalog-dialog">
            <h3 className="catalog-dialog-title">Usuń książkę</h3>
            <p>
              Czy na pewno chcesz usunąć <strong>„{book.title}"</strong>?
            </p>

            {deleteError && (
              <div className="catalog-dialog-error">
                ⚠️ {deleteError}
              </div>
            )}

            <div className="catalog-dialog-actions">
              <button
                onClick={() => { setConfirmOpen(false); setDeleteError(""); }}
                disabled={isDeleting}
                className="ui-btn ui-btn--secondary catalog-dialog-btn"
              >
                Anuluj
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="ui-btn ui-btn--danger catalog-dialog-btn is-danger"
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
