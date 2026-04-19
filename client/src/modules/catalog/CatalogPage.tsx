import { useState, useEffect } from "react";
import { BookCard } from "./components/BookCard";
import { BookFormModal } from "./components/BookFormModal";
import { apiClient } from "../../api/apiClient";
import { SmartPagination } from "../../components/pagination/SmartPagination";
import { getTotalPages, paginateItems } from "../../components/pagination/paginationUtils";
import type { Book } from "../../../../shared/src/models";
import "./catalog.css";

type CatalogPageProps = {
  isLoading?: boolean;
  pendingAction?: string | null;
  onPendingActionConsumed?: () => void;
};

export function CatalogPage({ isLoading = false, pendingAction, onPendingActionConsumed }: CatalogPageProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [isFetching, setIsFetching] = useState(isLoading);
  const [apiError, setApiError] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  const [titleQuery, setTitleQuery] = useState("");
  const [authorQuery, setAuthorQuery] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [isbnQuery, setIsbnQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const hasActiveFilters = Boolean(titleQuery || authorQuery || categoryQuery || isbnQuery);
  const sortedBooks = [...books].sort((a, b) => a.title.localeCompare(b.title, 'pl'));
  const totalPages = getTotalPages(sortedBooks.length, pageSize);
  const pagedBooks = paginateItems(sortedBooks, page, pageSize);


  const clearFilters = () => {
    setTitleQuery("");
    setAuthorQuery("");
    setCategoryQuery("");
    setIsbnQuery("");
  };

  const refreshCategories = async () => {
    try {
      const all = await apiClient.books.list({});
      const cats = [...new Set(all.flatMap((book) => book.categories))].sort();
      setAllCategories(cats);
    } catch {
      // Categories are supplementary. Keep current list if refresh fails.
    }
  };

  const fetchBooks = async () => {
    setIsFetching(true);
    setApiError(null);

    try {
      const data = await apiClient.books.list({
        title: titleQuery,
        author: authorQuery,
        category: categoryQuery,
        isbn: isbnQuery
      });
      setBooks(data);
    } catch (error) {
      console.error("Failed to fetch books", error);
      setApiError("Nie udalo sie pobrac listy ksiazek. Sprawdz polaczenie z API i sprobuj ponownie.");
    } finally {
      setIsFetching(false);
    }
  };

  // Load all categories for the dropdown once on mount
  useEffect(() => {
    refreshCategories();
  }, []);

  useEffect(() => {
    fetchBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleQuery, authorQuery, categoryQuery, isbnQuery]);

  useEffect(() => {
    setPage(1);
  }, [titleQuery, authorQuery, categoryQuery, isbnQuery]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // Quick action: open add-book modal
  useEffect(() => {
    if (pendingAction === 'add-book') {
      onPendingActionConsumed?.();
      setEditingBook(null);
      setIsModalOpen(true);
    }
  }, [pendingAction]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveBook = async (data: Partial<Book>) => {
    if (editingBook) {
      await apiClient.books.update(editingBook.id, data);
    } else {
      await apiClient.books.create(data);
    }
    fetchBooks();
    refreshCategories();
  };

  const handleDeleteBook = async (book: Book) => {
    await apiClient.books.delete(book.id);
    fetchBooks();
    refreshCategories();
  };

  const handleEditClick = (book: Book) => {
    setEditingBook(book);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <section className="module-page" aria-busy="true">
        <article className="module-card">
          <div className="skeleton skeleton-line skeleton-heading" />
          <div className="skeleton skeleton-line skeleton-paragraph" />
        </article>
      </section>
    );
  }

  return (
    <section className="module-page" aria-labelledby="catalog-title">
      <header className="module-page-head catalog-header">
        <div>
          <p className="module-kicker">Katalog</p>
          <h1 id="catalog-title">Przegląd zbiorów</h1>
          <p>Widok MVP pod katalog ksiazek, egzemplarze i podstawowe operacje biblioteczne.</p>
        </div>
        <button
          onClick={() => { setEditingBook(null); setIsModalOpen(true); }}
          className="ui-btn ui-btn--primary catalog-primary-btn"
        >
          + Dodaj Książkę
        </button>
      </header>

      <section className="catalog-filters" aria-label="Filtry katalogu">
        <input
          className="ui-input"
          type="text"
          placeholder="Tytuł książki..."
          value={titleQuery}
          onChange={(e) => setTitleQuery(e.target.value)}
        />
        <input
          className="ui-input"
          type="text"
          placeholder="Autor..."
          value={authorQuery}
          onChange={(e) => setAuthorQuery(e.target.value)}
        />
        <input
          className="ui-input"
          type="text"
          placeholder="ISBN..."
          value={isbnQuery}
          onChange={(e) => setIsbnQuery(e.target.value)}
        />
        <select
          className="ui-select"
          value={categoryQuery}
          onChange={(e) => setCategoryQuery(e.target.value)}
        >
          <option value="">Wszystkie kategorie</option>
          {allCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </section>

      <div className="module-state-row" role="status" aria-live="polite">
        <p>
          {hasActiveFilters
            ? `Wyniki po filtrach: ${books.length}`
            : `Wszystkie pozycje w widoku: ${books.length}`}
        </p>
        {hasActiveFilters ? (
          <button type="button" className="ui-btn ui-btn--compact ui-btn--ghost" onClick={clearFilters}>
            Wyczysc filtry
          </button>
        ) : null}
      </div>

      {apiError ? (
        <article className="module-card catalog-state" role="status">
          <h3>Blad pobierania danych</h3>
          <p>{apiError}</p>
          <div className="catalog-state-actions">
            <button type="button" className="ui-btn ui-btn--secondary" onClick={fetchBooks}>
              Sprobuj ponownie
            </button>
          </div>
        </article>
      ) : null}

      {isFetching ? (
        <div className="catalog-state">
          Wyszukiwanie...
        </div>
      ) : !apiError && books.length === 0 ? (
        <article className="module-card catalog-state">
          <h3>Brak wyników</h3>
          <p>Nie znaleziono książek pasujących do podanych kryteriów.</p>
        </article>
      ) : (
        <>
          <div className="catalog-grid">
            {pagedBooks.map((book) => (
              <BookCard key={book.id} book={book} onEdit={handleEditClick} onDelete={handleDeleteBook} />
            ))}
          </div>

          <SmartPagination
            label="Katalog"
            totalItems={books.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(next) => {
              setPageSize(next);
              setPage(1);
            }}
            pageSizeOptions={[9, 12, 15, 18]}
          />
        </>
      )}

      <BookFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingBook}
        onSave={handleSaveBook}
      />
    </section>
  );
}
