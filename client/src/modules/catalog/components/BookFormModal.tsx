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
    <div className="catalog-dialog-backdrop">
      <div className="module-card catalog-dialog">
        <h2 className="catalog-dialog-title">{initialData ? "Edytuj książkę" : "Dodaj nową książkę"}</h2>
        
        {errorMsg && (
          <div className="catalog-dialog-error">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="catalog-form">
          <div className="catalog-field">
            <label>Tytuł</label>
            <input className="ui-input" required type="text" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          
          <div className="catalog-field">
            <label>Autorzy (po przecinku)</label>
            <input className="ui-input" required type="text" value={authorsStr} onChange={e => setAuthorsStr(e.target.value)} />
          </div>

          <div className="catalog-field">
            <label>Kategorie (po przecinku)</label>
            <input className="ui-input" required type="text" value={categoriesStr} onChange={e => setCategoriesStr(e.target.value)} placeholder="Fantasy, Powieść..." />
          </div>
          
          <div className="catalog-form-grid">
            <div className="catalog-field">
              <label>ISBN</label>
              <input className="ui-input" required type="text" value={isbn} onChange={e => setIsbn(e.target.value)} />
            </div>
            <div className="catalog-field">
              <label>Rok wydania</label>
              <input className="ui-input" required type="number" value={publishedYear} onChange={e => setPublishedYear(Number(e.target.value))} />
            </div>
          </div>

          <div className="catalog-field">
            <label>Sztuki całkowite</label>
            <input className="ui-input" required type="number" min="1" value={totalCopies} onChange={e => setTotalCopies(Number(e.target.value))} />
          </div>

          <div className="catalog-dialog-actions">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="ui-btn ui-btn--secondary catalog-dialog-btn">
              Anuluj
            </button>
            <button type="submit" disabled={isSubmitting} className="ui-btn ui-btn--primary catalog-primary-btn">
              {isSubmitting ? "Zapisywanie..." : "Zapisz"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
