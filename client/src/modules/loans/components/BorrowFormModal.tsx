import { useState, useRef, useEffect } from 'react';
import type { Book, Reader } from '../../../../../shared/src/models';
import { apiClient } from '../../../api/apiClient';

type BorrowFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  readers: Reader[];
  books: Book[];
};

export function BorrowFormModal({ isOpen, onClose, onSuccess, readers, books }: BorrowFormModalProps) {
  const [readerQuery, setReaderQuery] = useState('');
  const [selectedReaderId, setSelectedReaderId] = useState('');
  const [readerOpen, setReaderOpen] = useState(false);

  const [bookQuery, setBookQuery] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [bookOpen, setBookOpen] = useState(false);

  const [days, setDays] = useState(14);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (readerRef.current && !readerRef.current.contains(e.target as Node)) {
        setReaderOpen(false);
      }
      if (bookRef.current && !bookRef.current.contains(e.target as Node)) {
        setBookOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeReaders = readers.filter((r) => r.status === 'ACTIVE');
  const filteredReaders = readerQuery.length >= 1
    ? activeReaders.filter((r) =>
      `${r.firstName} ${r.lastName} ${r.email}`.toLowerCase().includes(readerQuery.toLowerCase())
    ).slice(0, 8)
    : activeReaders.slice(0, 6);

  const filteredBooks = bookQuery.length >= 1
    ? books.filter((b) =>
      `${b.title} ${b.authors.join(' ')}`.toLowerCase().includes(bookQuery.toLowerCase())
    ).slice(0, 8)
    : books.slice(0, 6);

  const selectedReader = readers.find((r) => r.id === selectedReaderId);
  const selectedBook = books.find((b) => b.id === selectedBookId);

  const handleSelectReader = (r: Reader) => {
    setSelectedReaderId(r.id);
    setReaderQuery(`${r.firstName} ${r.lastName}`);
    setReaderOpen(false);
  };

  const handleSelectBook = (b: Book) => {
    setSelectedBookId(b.id);
    setBookQuery(b.title);
    setBookOpen(false);
  };

  const handleClearReader = () => {
    setSelectedReaderId('');
    setReaderQuery('');
    setReaderOpen(false);
  };

  const handleClearBook = () => {
    setSelectedBookId('');
    setBookQuery('');
    setBookOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReaderId) { setError('Wybierz czytelnika z listy.'); return; }
    if (!selectedBookId) { setError('Wybierz książkę z listy.'); return; }
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.loans.borrow({ readerId: selectedReaderId, bookId: selectedBookId, days });
      handleClose();
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSelectedReaderId(''); setReaderQuery(''); setReaderOpen(false);
    setSelectedBookId(''); setBookQuery(''); setBookOpen(false);
    setDays(14);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="loans-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="borrow-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="loans-modal module-card">
        <h2 id="borrow-modal-title" className="loans-modal-title">📚 Nowe wypożyczenie</h2>

        {error && <p className="loans-modal-error" role="alert">{error}</p>}

        <form className="loans-form" onSubmit={handleSubmit} id="borrow-form">

          {/* ── Reader autocomplete ── */}
          <div className="loans-field">
            <label htmlFor="borrow-reader-input">Czytelnik</label>
            <div className="ac-wrap" ref={readerRef}>
              <div className="ac-input-row">
                <input
                  id="borrow-reader-input"
                  type="text"
                  className="ac-input"
                  placeholder="Wpisz imię, nazwisko lub e-mail…"
                  value={readerQuery}
                  autoComplete="off"
                  onChange={(e) => {
                    setReaderQuery(e.target.value);
                    setSelectedReaderId('');
                    setReaderOpen(true);
                  }}
                  onFocus={() => setReaderOpen(true)}
                  aria-expanded={readerOpen}
                  aria-autocomplete="list"
                />
                {selectedReaderId && (
                  <button type="button" className="ac-clear" onClick={handleClearReader} aria-label="Wyczyść wybór czytelnika">×</button>
                )}
              </div>
              {selectedReader && (
                <div className="ac-selected-badge">
                  <span className="ac-dot ac-dot--ok" />
                  {selectedReader.firstName} {selectedReader.lastName} — {selectedReader.email}
                </div>
              )}
              {readerOpen && !selectedReaderId && (
                <ul className="ac-dropdown" role="listbox" aria-label="Wyniki wyszukiwania czytelników">
                  {filteredReaders.length === 0 ? (
                    <li className="ac-empty">Brak wyników</li>
                  ) : filteredReaders.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        className="ac-option"
                        role="option"
                        onClick={() => handleSelectReader(r)}
                      >
                        <span className="ac-option-main">{r.firstName} {r.lastName}</span>
                        <span className="ac-option-sub">{r.email}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ── Book autocomplete ── */}
          <div className="loans-field">
            <label htmlFor="borrow-book-input">Książka</label>
            <div className="ac-wrap" ref={bookRef}>
              <div className="ac-input-row">
                <input
                  id="borrow-book-input"
                  type="text"
                  className="ac-input"
                  placeholder="Wpisz tytuł lub autora…"
                  value={bookQuery}
                  autoComplete="off"
                  onChange={(e) => {
                    setBookQuery(e.target.value);
                    setSelectedBookId('');
                    setBookOpen(true);
                  }}
                  onFocus={() => setBookOpen(true)}
                  aria-expanded={bookOpen}
                  aria-autocomplete="list"
                />
                {selectedBookId && (
                  <button type="button" className="ac-clear" onClick={handleClearBook} aria-label="Wyczyść wybór książki">×</button>
                )}
              </div>
              {selectedBook && (
                <div className="ac-selected-badge">
                  <span className={`ac-dot ${selectedBook.availableCopies > 0 ? 'ac-dot--ok' : 'ac-dot--none'}`} />
                  {selectedBook.title}
                  {selectedBook.availableCopies > 0
                    ? ` — dostępne: ${selectedBook.availableCopies}`
                    : ' — brak egzemplarzy'}
                </div>
              )}
              {bookOpen && !selectedBookId && (
                <ul className="ac-dropdown" role="listbox" aria-label="Wyniki wyszukiwania książek">
                  {filteredBooks.length === 0 ? (
                    <li className="ac-empty">Brak wyników</li>
                  ) : filteredBooks.map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        className={`ac-option ${b.availableCopies === 0 ? 'ac-option--unavailable' : ''}`}
                        role="option"
                        onClick={() => { if (b.availableCopies > 0) handleSelectBook(b); }}
                        disabled={b.availableCopies === 0}
                        title={b.availableCopies === 0 ? 'Brak dostępnych egzemplarzy' : undefined}
                      >
                        <span className="ac-option-main">
                          <span className={`ac-dot ${b.availableCopies > 0 ? 'ac-dot--ok' : 'ac-dot--none'}`} />
                          {b.title}
                        </span>
                        <span className="ac-option-sub">
                          {b.authors.join(', ')}
                          <span className={`ac-avail ${b.availableCopies === 0 ? 'ac-avail--none' : ''}`}>
                            {b.availableCopies > 0 ? ` • dostępne: ${b.availableCopies}` : ' • niedostępna'}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ── Days ── */}
          <div className="loans-field">
            <label htmlFor="borrow-days">Liczba dni wypożyczenia</label>
            <input
              id="borrow-days"
              type="number"
              min={1}
              max={90}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </div>
        </form>

        <div className="loans-modal-actions">
          <button type="button" className="ui-btn ui-btn--ghost" onClick={handleClose} disabled={isSubmitting}>
            Anuluj
          </button>
          <button type="submit" form="borrow-form" className="ui-btn ui-btn--primary" disabled={isSubmitting || !selectedReaderId || !selectedBookId}>
            {isSubmitting ? 'Przetwarzanie…' : 'Wypożycz'}
          </button>
        </div>
      </div>
    </div>
  );
}
