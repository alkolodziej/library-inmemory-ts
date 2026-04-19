import { useState } from 'react';
import type { Book, Loan, Reader } from '../../../../../shared/src/models';
import { apiClient } from '../../../api/apiClient';

type ConfirmReturnModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  loan: Loan | null;
  book?: Book;
  reader?: Reader;
};

export function ConfirmReturnModal({ isOpen, onClose, onSuccess, loan, book, reader }: ConfirmReturnModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !loan) return null;

  const readerName = reader ? `${reader.firstName} ${reader.lastName}` : loan.readerId;
  const bookTitle = book?.title ?? loan.bookId;
  const borrowedAt = new Date(loan.borrowedAt).toLocaleDateString('pl-PL');
  const dueAt = new Date(loan.dueAt).toLocaleDateString('pl-PL');

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.loans.return(loan.id);
      onClose();
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="loans-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-return-title"
      onClick={(e) => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}
    >
      <div className="loans-modal module-card" style={{ maxWidth: 420 }}>
        <div className="fee-modal-head">
          <span className="fee-modal-icon" aria-hidden="true">📘</span>
          <h2 id="confirm-return-title" className="loans-modal-title">
            Potwierdzenie zwrotu
          </h2>
        </div>

        <div className="fee-modal-info">
          <div className="fee-modal-row">
            <span className="fee-modal-label">Czytelnik</span>
            <span className="fee-modal-value">{readerName}</span>
          </div>
          <div className="fee-modal-row">
            <span className="fee-modal-label">Tytuł</span>
            <span className="fee-modal-value">{bookTitle}</span>
          </div>
          <div className="fee-modal-row">
            <span className="fee-modal-label">Data wypożyczenia</span>
            <span className="fee-modal-value">{borrowedAt}</span>
          </div>
          <div className="fee-modal-row">
            <span className="fee-modal-label">Termin zwrotu</span>
            <span className="fee-modal-value" style={{ color: '#0c6b45', fontWeight: 700 }}>{dueAt}</span>
          </div>
        </div>

        <p style={{ margin: '0 0 1rem', fontSize: 'var(--text-sm)', color: 'var(--ink-soft)' }}>
          Zwrot w terminie — brak dodatkowych opłat.
        </p>

        {error && <p className="loans-modal-error" role="alert">{error}</p>}

        <div className="loans-modal-actions">
          <button
            type="button"
            className="ui-btn ui-btn--ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Anuluj
          </button>
          <button
            type="button"
            className="ui-btn ui-btn--primary"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Przetwarzanie…' : 'Potwierdź zwrot'}
          </button>
        </div>
      </div>
    </div>
  );
}
