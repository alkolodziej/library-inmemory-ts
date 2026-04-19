import type { Book, Loan, Reader } from '../../../../../shared/src/models';

type LoanRowProps = {
  loan: Loan;
  reader?: Reader;
  book?: Book;
  onReturn?: (loan: Loan) => void;
  onExtend?: (loan: Loan) => void;
  onSuspendReader?: (loan: Loan) => void;
};

export function getEffectiveStatus(loan: Loan): 'ACTIVE' | 'OVERDUE' | 'RETURNED' {
  if (loan.status === 'RETURNED') return 'RETURNED';
  if (new Date(loan.dueAt).getTime() < Date.now()) return 'OVERDUE';
  return 'ACTIVE';
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Aktywne',
  OVERDUE: 'Po terminie',
  RETURNED: 'Zwrócone',
};

const STATUS_CLASS: Record<string, string> = {
  ACTIVE: 'loans-badge--active',
  OVERDUE: 'loans-badge--overdue',
  RETURNED: 'loans-badge--returned',
};

export function LoanRow({ loan, reader, book, onReturn, onExtend, onSuspendReader }: LoanRowProps) {
  const status = getEffectiveStatus(loan);
  const borrowedAt = new Date(loan.borrowedAt).toLocaleDateString('pl-PL');
  const dueAt = new Date(loan.dueAt).toLocaleDateString('pl-PL');
  const returnedAt = loan.returnedAt ? new Date(loan.returnedAt).toLocaleDateString('pl-PL') : '—';

  const readerName = reader ? `${reader.firstName} ${reader.lastName}` : loan.readerId.slice(0, 8) + '…';
  const bookTitle = book?.title ?? loan.bookId.slice(0, 18) + '…';
  const isReaderSuspended = reader?.status === 'SUSPENDED';

  const daysOverdue = status === 'OVERDUE'
    ? Math.max(0, Math.floor((Date.now() - new Date(loan.dueAt).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <tr>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
          <span title={loan.readerId}>{readerName}</span>
          {isReaderSuspended && (
            <span className="loans-suspended-badge" title="Konto zawieszone" style={{ flexShrink: 0 }}>zawieszone</span>
          )}
          {status === 'OVERDUE' && !isReaderSuspended && onSuspendReader && (
            <button
              type="button"
              className="loans-reader-link"
              onClick={() => onSuspendReader(loan)}
              title="Zawie\u015b konto czytelnika"
              aria-label={`Zawie\u015b konto: ${readerName}`}
              style={{ flexShrink: 0 }}
            >
              🔒
            </button>
          )}
        </div>
      </td>
      <td><span title={book?.isbn}>{bookTitle}</span></td>
      <td>{borrowedAt}</td>
      <td>
        <span style={status === 'OVERDUE' ? { color: '#b24708', fontWeight: 700 } : undefined}>
          {dueAt}
        </span>
      </td>
      <td>{returnedAt}</td>
      <td>
        <span className={`loans-badge ${STATUS_CLASS[status]}`}>
          <span className="loans-badge-dot" aria-hidden="true" />
          {STATUS_LABEL[status]}
          {status === 'OVERDUE' && (
            <span style={{ fontWeight: 400, opacity: 0.85 }}>&nbsp;(+{daysOverdue}&nbsp;{daysOverdue === 1 ? 'dz.' : 'dni'})</span>
          )}
        </span>
      </td>
      <td>
        <div className="loans-row-actions">
          {status !== 'RETURNED' && onReturn && (
            <button
              type="button"
              className="loans-return-btn"
              onClick={() => onReturn(loan)}
              aria-label={`Zwróć: ${bookTitle}`}
            >
              Zwróć
            </button>
          )}
          {status !== 'RETURNED' && onExtend && (
            <button
              type="button"
              className={`loans-return-btn loans-extend-btn${status === 'OVERDUE' ? ' loans-extend-btn--overdue' : ''}`}
              onClick={() => onExtend(loan)}
              aria-label={`Przedłuż: ${bookTitle}`}
            >
              +7 dni
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
