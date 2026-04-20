import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import type { Book } from "../../../../../shared/src/models";


// ─── ISBN masking helpers ─────────────────────────────────────────────────────
// Format: 978-XX-XXXX-XXX-X  (positions of dashes: 3, 6, 11, 15 in the final string)
// Raw digits positions:       0-2, 3-4, 5-8, 9-11, 12
const ISBN_MASK = "978-__-____-___-_"; // visual placeholder

function applyIsbnMask(raw: string): string {
  // Strip non-digits, keep only up to 13
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  // If empty, return empty string
  if (!digits) return "";
  // Build formatted string per segment sizes: 3-2-4-3-1
  const segments = [3, 2, 4, 3, 1];
  let result = "";
  let idx = 0;
  for (let s = 0; s < segments.length; s++) {
    const chunk = digits.slice(idx, idx + segments[s]);
    if (!chunk) break;
    if (s > 0) result += "-";
    result += chunk;
    idx += segments[s];
  }
  return result;
}

function isbnRawDigits(formatted: string): string {
  return formatted.replace(/\D/g, "");
}

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
        setIsbn(applyIsbnMask(initialData.isbn));
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

  // ── ISBN input handler ──
  const handleIsbnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const prev = isbn;
    const next = e.target.value;
    // Allow backspace to delete including dashes
    const rawNext = isbnRawDigits(next);
    const rawPrev = isbnRawDigits(prev);
    if (rawNext.length <= rawPrev.length) {
      // deletion — strip last digit
      setIsbn(applyIsbnMask(rawPrev.slice(0, -1)));
    } else {
      setIsbn(applyIsbnMask(next));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const rawIsbn = isbnRawDigits(isbn);
    if (rawIsbn.length !== 13) {
      setErrorMsg("ISBN musi mieć dokładnie 13 cyfr (format: 978-XX-XXXX-XXX-X).");
      return;
    }

    const payload: Partial<Book> = {
      isbn: isbn, // formatted with dashes
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
    <>
      <div className="catalog-dialog-backdrop">
        <div className="module-card catalog-dialog">
          <h2 className="catalog-dialog-title">{initialData ? "Edytuj książkę" : "Dodaj nową książkę"}</h2>

          {errorMsg && (
            <div className="catalog-dialog-error">{errorMsg}</div>
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
                <input
                  className="ui-input"
                  required
                  type="text"
                  value={isbn}
                  onChange={handleIsbnChange}
                  placeholder={ISBN_MASK}
                  inputMode="numeric"
                  maxLength={17}
                />
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
    </>
  );
}
