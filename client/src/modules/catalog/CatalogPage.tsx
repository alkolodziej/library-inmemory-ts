import { useState, useEffect } from "react";
import { BookCard } from "./components/BookCard";
import { BookFormModal } from "./components/BookFormModal";
import { apiClient } from "../../api/apiClient";
import type { Book } from "../../../../shared/src/models";

type CatalogPageProps = {
  isLoading?: boolean;
};

export function CatalogPage({ isLoading = false }: CatalogPageProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [isFetching, setIsFetching] = useState(isLoading);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  const [titleQuery, setTitleQuery] = useState("");
  const [authorQuery, setAuthorQuery] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [isbnQuery, setIsbnQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const fetchBooks = async () => {
    setIsFetching(true);
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
    } finally {
      setIsFetching(false);
    }
  };

  // Load all categories for the dropdown once on mount
  useEffect(() => {
    apiClient.books.list({}).then(all => {
      const cats = [...new Set(all.flatMap(b => b.categories))].sort();
      setAllCategories(cats);
    }).catch(() => { });
  }, []);

  useEffect(() => {
    fetchBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleQuery, authorQuery, categoryQuery, isbnQuery]);

  const handleSaveBook = async (data: Partial<Book>) => {
    if (editingBook) {
      await apiClient.books.update(editingBook.id, data);
    } else {
      await apiClient.books.create(data);
    }
    fetchBooks();
    // Refresh categories list too
    apiClient.books.list({}).then(all => {
      const cats = [...new Set(all.flatMap(b => b.categories))].sort();
      setAllCategories(cats);
    }).catch(() => { });
  };

  const handleDeleteBook = async (book: Book) => {
    await apiClient.books.delete(book.id);
    fetchBooks();
    apiClient.books.list({}).then(all => {
      const cats = [...new Set(all.flatMap(b => b.categories))].sort();
      setAllCategories(cats);
    }).catch(() => { });
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
      <header className="module-page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p className="module-kicker">Katalog</p>
          <h1 id="catalog-title">Przegląd zbiorów</h1>
          <p>Widok MVP pod katalog ksiazek, egzemplarze i podstawowe operacje biblioteczne.</p>
        </div>
        <button
          onClick={() => { setEditingBook(null); setIsModalOpen(true); }}
          style={{ padding: "0.75rem 1.25rem", background: "var(--brand, black)", color: "white", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 500 }}
        >
          + Dodaj Książkę
        </button>
      </header>

      <section style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Tytuł książki..."
          value={titleQuery}
          onChange={(e) => setTitleQuery(e.target.value)}
          style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid oklch(0.8 0 0)", flex: 1, minWidth: "200px" }}
        />
        <input
          type="text"
          placeholder="Autor..."
          value={authorQuery}
          onChange={(e) => setAuthorQuery(e.target.value)}
          style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid oklch(0.8 0 0)", flex: 1, minWidth: "200px" }}
        />
        <input
          type="text"
          placeholder="ISBN..."
          value={isbnQuery}
          onChange={(e) => setIsbnQuery(e.target.value)}
          style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid oklch(0.8 0 0)", flex: 1, minWidth: "150px" }}
        />
        <select
          value={categoryQuery}
          onChange={(e) => setCategoryQuery(e.target.value)}
          style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid oklch(0.8 0 0)", flex: 1, minWidth: "200px", backgroundColor: "#fff" }}
        >
          <option value="">Wszystkie kategorie</option>
          {allCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </section>

      {isFetching ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "oklch(0.6 0 0)" }}>
          Wyszukiwanie...
        </div>
      ) : books.length === 0 ? (
        <article className="module-card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <h3>Brak wyników</h3>
          <p>Nie znaleziono książek pasujących do podanych kryteriów.</p>
        </article>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.5rem"
        }}>
          {books.map(book => (
            <BookCard key={book.id} book={book} onEdit={handleEditClick} onDelete={handleDeleteBook} />
          ))}
        </div>
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
