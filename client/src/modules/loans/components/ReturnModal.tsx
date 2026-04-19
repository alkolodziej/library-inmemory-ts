import { useState } from 'react';
import type { Book, Loan, Reader } from '../../../../../shared/src/models';

type ReturnModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (loan: Loan) => void;
  loans: Loan[];
  readers: Reader[];
  books: Book[];
};

function getEffectiveStatus(loan: Loan): 'ACTIVE' | 'OVERDUE' | 'RETURNED' {
  if (loan.status === 'RETURNED') return 'RETURNED';
  if (new Date(loan.dueAt).getTime() < Date.now()) return 'OVERDUE';
  return 'ACTIVE';
}

export function ReturnModal({ isOpen, onClose, onSelect, loans, readers, books }: ReturnModalProps) {
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [query, setQuery] = useState('');

  const getReader = (id: string) => readers.find((r) => r.id === id);
  const getBook = (id: string) => books.find((b) => b.id === id);

  const activeLoans = loans.filter((l) => getEffectiveStatus(l) !== 'RETURNED');

  const filtered = query.trim().length >= 1
    ? activeLoans.filter((l) => {
        const r = getReader(l.readerId);
        const b = getBook(l.bookId);
        const haystack = [
          r?.firstName, r?.lastName, r?.email, b?.title,
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
    : activeLoans;

  const handleConfirm = () => {
    const loan = loans.find((l) => l.id === selectedLoanId);
    if (!loan) return;
    onSelect(loan);
    setSelectedLoanId('');
    setQuery('');
  };

  const handleClose = () => {
    setSelectedLoanId('');
    setQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="loans-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="return-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="loans-modal module-card">
        <h2 id="return-modal-title" className="loans-modal-title">↩ Wybierz wypożyczenie do zwrotu</h2>

        {activeLoans.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)', fontSize: 'var(--text-sm)', margin: 0 }}>
            Brak aktywnych wypożyczeń do zwrotu.
          </p>
        ) : (
          <>
            <div className="loans-field">
              <label htmlFor="return-search">Szukaj czytelnika lub tytułu</label>
              <input
                id="return-search"
                type="text"
                placeholder="Wpisz imię, nazwisko lub tytuł…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="loans-return-list">
              {filtered.length === 0 ? (
                <p style={{ color: 'var(--ink-soft)', fontSize: 'var(--text-sm)', margin: 0 }}>Brak wyników.</p>
              ) : filtered.map((loan) => {
                const reader = getReader(loan.readerId);
                const book = getBook(loan.bookId);
                const status = getEffectiveStatus(loan);
                const dueDate = new Date(loan.dueAt).toLocaleDateString('pl-PL');
                return (
                  <button
                    key={loan.id}
                    type="button"
                    className={`loans-return-option${selectedLoanId === loan.id ? ' is-selected' : ''}`}
                    onClick={() => setSelectedLoanId(loan.id)}
                    aria-pressed={selectedLoanId === loan.id}
                  >
                    <p className="loans-return-option-title">
                      {book?.title ?? loan.bookId}
                    </p>
                    <p className="loans-return-option-meta">
                      {reader ? `${reader.firstName} ${reader.lastName}` : loan.readerId}
                      {' · '}termin: {dueDate}
                      {status === 'OVERDUE' && (
                        <span style={{ color: '#b24708', marginLeft: '0.35rem', fontWeight: 700 }}>
                          ⚠ po terminie
                        </span>
                      )}
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="loans-modal-actions">
          <button type="button" className="ui-btn ui-btn--ghost" onClick={handleClose}>
            Anuluj
          </button>
          <button
            type="button"
            className="ui-btn ui-btn--primary"
            disabled={!selectedLoanId}
            onClick={handleConfirm}
          >
            Dalej →
          </button>
        </div>
      </div>
    </div>
  );
}
