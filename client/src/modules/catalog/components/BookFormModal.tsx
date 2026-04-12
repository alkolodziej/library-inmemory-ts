import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import type { Book } from "../../../../../shared/src/models";

type BookFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Book>) => Promise<void>;
  initialData?: Book | null;
};

export function BookFormModal({ isOpen, onClose, onSave, initialData }: BookFormModalProps) {
  const [isbn, setIsbn] = useState("");
  const [title, setTitle] = useState("");
  const [authorsStr, setAuthorsStr] = useState("");
  const [categoriesStr, setCategoriesStr] = useState("");
  const [publishedYear, setPublishedYear] = useState<number>(new Date().getFullYear());
  const [totalCopies, setTotalCopies] = useState<number>(1);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setIsbn(initialData.isbn);
        setTitle(initialData.title);
        setAuthorsStr(initialData.authors.join(", "));
        setCategoriesStr(initialData.categories.join(", "));
        setPublishedYear(initialData.publishedYear);
        setTotalCopies(initialData.totalCopies);
      } else {
        setIsbn("");
        setTitle("");
        setAuthorsStr("");
        setCategoriesStr("");
        setPublishedYear(new Date().getFullYear());
        setTotalCopies(1);
      }
      setErrorMsg("");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    const payload: Partial<Book> = {
      isbn,
      title,
      authors: authorsStr.split(",").map(s => s.trim()).filter(Boolean),
      categories: categoriesStr.split(",").map(s => s.trim()).filter(Boolean),
      publishedYear,
      totalCopies,
    };

    setIsSubmitting(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Wystąpił błąd podczas zapisywania.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000
    }}>
      <div className="module-card" style={{ width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto" }}>
        <h2 style={{ marginTop: 0 }}>{initialData ? "Edytuj książkę" : "Dodaj nową książkę"}</h2>
        
        {errorMsg && (
          <div style={{ padding: "0.5rem", backgroundColor: "oklch(0.6 0.2 25)", color: "white", borderRadius: "0.5rem", marginBottom: "1rem" }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>Tytuł</label>
            <input required type="text" value={title} onChange={e => setTitle(e.target.value)} style={{ width: "100%", padding: "0.5rem" }} />
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>Autorzy (po przecinku)</label>
            <input required type="text" value={authorsStr} onChange={e => setAuthorsStr(e.target.value)} style={{ width: "100%", padding: "0.5rem" }} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>Kategorie (po przecinku)</label>
            <input required type="text" value={categoriesStr} onChange={e => setCategoriesStr(e.target.value)} style={{ width: "100%", padding: "0.5rem" }} placeholder="Fantasy, Powieść..." />
          </div>
          
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>ISBN</label>
              <input required type="text" value={isbn} onChange={e => setIsbn(e.target.value)} style={{ width: "100%", padding: "0.5rem" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>Rok wydania</label>
              <input required type="number" value={publishedYear} onChange={e => setPublishedYear(Number(e.target.value))} style={{ width: "100%", padding: "0.5rem" }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>Sztuki całkowite</label>
            <input required type="number" min="1" value={totalCopies} onChange={e => setTotalCopies(Number(e.target.value))} style={{ width: "100%", padding: "0.5rem" }} />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
            <button type="button" onClick={onClose} disabled={isSubmitting} style={{ padding: "0.5rem 1rem", border: "1px solid #ccc", background: "transparent", borderRadius: "0.5rem" }}>
              Anuluj
            </button>
            <button type="submit" disabled={isSubmitting} style={{ padding: "0.5rem 1rem", background: "var(--brand, blue)", color: "white", border: "none", borderRadius: "0.5rem" }}>
              {isSubmitting ? "Zapisywanie..." : "Zapisz"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
