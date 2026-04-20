import { useState, useEffect } from 'react';
import type { Book, Loan, Reader } from '../../../../../shared/src/models';

const FEE_PER_DAY = 0.5; // PLN
const EXTEND_ADMIN_FEE = 5.0; // PLN flat

export type FeeModalMode = 'return' | 'extend';

type FeeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  mode: FeeModalMode;
  loan: Loan | null;
  book?: Book;
  reader?: Reader;
  isSubmitting: boolean;
  error?: string | null;
};

function calcDaysOverdue(dueAt: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dueAt).getTime()) / (1000 * 60 * 60 * 24)));
}

export function FeeModal({ isOpen, onClose, onConfirm, mode, loan, book, reader, isSubmitting, error }: FeeModalProps) {
  const [discountDays, setDiscountDays] = useState(0);

  useEffect(() => {
    if (isOpen) setDiscountDays(0);
  }, [isOpen, loan]);

  if (!isOpen || !loan) return null;

  const daysOverdue = calcDaysOverdue(loan.dueAt);
  const isOverdue = daysOverdue > 0;

  // Effective overdue days after discount
  const effectiveDays = Math.max(0, daysOverdue - discountDays);

  const returnFee = +(effectiveDays * FEE_PER_DAY).toFixed(2);
  const extendFee = isOverdue ? +(EXTEND_ADMIN_FEE + effectiveDays * FEE_PER_DAY).toFixed(2) : 0;
  const fee = mode === 'return' ? returnFee : extendFee;

  const readerName = reader ? `${reader.firstName} ${reader.lastName}` : loan.readerId;
  const bookTitle = book?.title ?? loan.bookId;
  const dueFormatted = new Date(loan.dueAt).toLocaleDateString('pl-PL');

  const isReturnOverdue = mode === 'return' && isOverdue;
  const isExtendOverdue = mode === 'extend' && isOverdue;
  const isExtendFree = mode === 'extend' && !isOverdue;

  const showDiscount = isOverdue && (isReturnOverdue || isExtendOverdue);

  return (
    <div
      className="loans-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fee-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}
    >
      <div className="loans-modal module-card fee-modal">
        {/* Icon + title */}
        <div className="fee-modal-head">
          <span className="fee-modal-icon" aria-hidden="true">
            {isExtendFree ? '📅' : '💳'}
          </span>
          <h2 id="fee-modal-title" className="loans-modal-title">
            {isReturnOverdue && 'Zwrot po terminie'}
            {isExtendOverdue && 'Przedłużenie — opłata administracyjna'}
            {isExtendFree && 'Potwierdzenie przedłużenia'}
          </h2>
        </div>

        {/* Loan info */}
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
            <span className="fee-modal-label">Termin zwrotu</span>
            <span className="fee-modal-value" style={isOverdue ? { color: '#b24708', fontWeight: 700 } : undefined}>
              {dueFormatted}
            </span>
          </div>
          {isOverdue && (
            <div className="fee-modal-row">
              <span className="fee-modal-label">Dni po terminie</span>
              <span className="fee-modal-value" style={{ color: '#b24708', fontWeight: 700 }}>
                {daysOverdue} {daysOverdue === 1 ? 'dzień' : 'dni'}
              </span>
            </div>
          )}
          {mode === 'extend' && (
            <div className="fee-modal-row">
              <span className="fee-modal-label">Przedłużenie o</span>
              <span className="fee-modal-value">7 dni</span>
            </div>
          )}
        </div>

        {/* Discount section */}
        {showDiscount && (
          <div className="fee-modal-discount">
            <div className="fee-modal-discount-header">
              <span className="fee-modal-discount-label">
                🏥 Ulga (np. zwolnienie lekarskie)
              </span>
              <span className="fee-modal-discount-days">
                -{discountDays} {discountDays === 1 ? 'dzień' : 'dni'}
              </span>
            </div>
            <div className="fee-modal-discount-row">
              <span className="fee-modal-discount-hint">0</span>
              <input
                id="discount-slider"
                type="range"
                min={0}
                max={daysOverdue}
                value={discountDays}
                onChange={e => setDiscountDays(Number(e.target.value))}
                className="fee-modal-slider"
                disabled={isSubmitting}
              />
              <span className="fee-modal-discount-hint">{daysOverdue}</span>
            </div>
            {discountDays > 0 && (
              <p className="fee-modal-discount-note">
                Odjęto {discountDays} {discountDays === 1 ? 'dzień' : 'dni'} przetrzymania.
                {effectiveDays > 0
                  ? ` Płatne pozostaje ${effectiveDays} ${effectiveDays === 1 ? 'dzień' : 'dni'}.`
                  : ' Kara za przetrzymanie wynosi 0 zł.'}
              </p>
            )}
          </div>
        )}

        {/* Fee breakdown */}
        {!isExtendFree && (
          <div className="fee-modal-breakdown">
            {isReturnOverdue && (
              <div className="fee-modal-calc">
                <span>
                  {effectiveDays} dni × {FEE_PER_DAY.toFixed(2)} PLN/dzień
                  {discountDays > 0 && (
                    <span className="fee-modal-discount-badge"> (ulga: -{discountDays} dni)</span>
                  )}
                </span>
                <span className="fee-modal-total">{fee.toFixed(2)} PLN</span>
              </div>
            )}
            {isExtendOverdue && (
              <>
                <div className="fee-modal-calc">
                  <span>Opłata administracyjna</span>
                  <span>{EXTEND_ADMIN_FEE.toFixed(2)} PLN</span>
                </div>
                <div className="fee-modal-calc">
                  <span>
                    Kara za {effectiveDays} dni × {FEE_PER_DAY.toFixed(2)} PLN
                    {discountDays > 0 && (
                      <span className="fee-modal-discount-badge"> (ulga: -{discountDays} dni)</span>
                    )}
                  </span>
                  <span>{(effectiveDays * FEE_PER_DAY).toFixed(2)} PLN</span>
                </div>
                <div className="fee-modal-calc fee-modal-calc--total">
                  <span>Łącznie do zapłaty</span>
                  <span className="fee-modal-total">{fee.toFixed(2)} PLN</span>
                </div>
              </>
            )}
          </div>
        )}

        {isExtendFree && (
          <p className="fee-modal-free-note">
            Wypożyczenie jest aktywne. Przedłużenie jest bezpłatne — nowy termin zostanie ustawiony za 7 dni od obecnego.
          </p>
        )}

        {error && <p className="loans-modal-error" role="alert">{error}</p>}

        {/* Simulated payment notice */}
        {!isExtendFree && (
          <p className="fee-modal-sim-note">
            ⚙ Środowisko demonstracyjne — płatność jest symulowana.
          </p>
        )}

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
            className={`ui-btn ${isExtendFree ? 'ui-btn--primary' : 'ui-btn--primary fee-modal-pay-btn'}`}
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Przetwarzanie…'
              : isExtendFree
              ? 'Przedłuż o 7 dni'
              : fee === 0
              ? 'Kontynuuj'
              : `Zapłacono ${fee.toFixed(2)} PLN — kontynuuj`}
          </button>
        </div>
      </div>
    </div>
  );
}
