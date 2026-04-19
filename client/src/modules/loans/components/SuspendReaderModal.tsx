import { useState } from 'react';
import type { Book, Loan, Reader } from '../../../../../shared/src/models';
import { apiClient } from '../../../api/apiClient';

type SuspendReaderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  loan: Loan | null;
  reader?: Reader;
  book?: Book;
};

export function SuspendReaderModal({ isOpen, onClose, onSuccess, loan, reader, book }: SuspendReaderModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !loan) return null;

  const readerName = reader ? `${reader.firstName} ${reader.lastName}` : loan.readerId;
  const bookTitle = book?.title ?? loan.bookId;
  const daysOverdue = Math.max(0, Math.floor((Date.now() - new Date(loan.dueAt).getTime()) / (1000 * 60 * 60 * 24)));

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.readers.update(loan.readerId, { status: 'SUSPENDED' });
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
      aria-labelledby="suspend-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}
    >
      <div className="loans-modal module-card" style={{ maxWidth: 440 }}>
        <div className="fee-modal-head">
          <span className="fee-modal-icon" aria-hidden="true">🔒</span>
          <h2 id="suspend-modal-title" className="loans-modal-title">
            Zawieszenie konta czytelnika
          </h2>
        </div>

        <div className="fee-modal-info">
          <div className="fee-modal-row">
            <span className="fee-modal-label">Czytelnik</span>
            <span className="fee-modal-value">{readerName}</span>
          </div>
          {reader?.email && (
            <div className="fee-modal-row">
              <span className="fee-modal-label">E-mail</span>
              <span className="fee-modal-value">{reader.email}</span>
            </div>
          )}
          <div className="fee-modal-row">
            <span className="fee-modal-label">Przetrzymana książka</span>
            <span className="fee-modal-value">{bookTitle}</span>
          </div>
          <div className="fee-modal-row">
            <span className="fee-modal-label">Dni po terminie</span>
            <span className="fee-modal-value" style={{ color: '#b24708', fontWeight: 700 }}>
              {daysOverdue} {daysOverdue === 1 ? 'dzień' : 'dni'}
            </span>
          </div>
        </div>

        <div style={{ background: '#fff4ec', border: '1px solid #f0c5a8', borderRadius: 10, padding: '0.65rem 0.8rem', marginBottom: '0.9rem' }}>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: '#7a3410', lineHeight: 1.5 }}>
            <strong>Skutki zawieszenia:</strong> czytelnik nie będzie mógł wypożyczyć nowych książek.
            Zawieszenie można cofnąć w module Czytelnicy.
          </p>
        </div>

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
            className="ui-btn ui-btn--danger"
            onClick={handleConfirm}
            disabled={isSubmitting}
            style={{ background: '#fff0e6', borderColor: '#f0c5a8', color: '#7a3410' }}
          >
            {isSubmitting ? 'Zawieszanie…' : '🔒 Zawieś konto'}
          </button>
        </div>
      </div>
    </div>
  );
}
