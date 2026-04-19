import { useEffect, useMemo, useState } from 'react';
import type { Book, Loan, Reader } from '../../../../shared/src/models';
import { apiClient } from '../../api/apiClient';
import { SmartPagination } from '../../components/pagination/SmartPagination';
import { getTotalPages, paginateItems } from '../../components/pagination/paginationUtils';
import { BorrowFormModal } from './components/BorrowFormModal';
import { ConfirmReturnModal } from './components/ConfirmReturnModal';
import { FeeModal, type FeeModalMode } from './components/FeeModal';
import { LoanRow, getEffectiveStatus } from './components/LoanRow';
import { ReturnModal } from './components/ReturnModal';
import { SuspendReaderModal } from './components/SuspendReaderModal';
import './loans.css';
import './loans_extra.css';

type LoanStatusFilter = 'ALL' | 'ACTIVE' | 'OVERDUE' | 'RETURNED';
type SortKey = 'reader' | 'book' | 'borrowedAt' | 'dueAt' | 'returnedAt';
type SortDir = 'asc' | 'desc';

type LoansPageProps = { isLoading?: boolean; pendingAction?: string | null; onPendingActionConsumed?: () => void };

function calcDaysOverdue(dueAt: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dueAt).getTime()) / (1000 * 60 * 60 * 24)));
}

export function LoansPage({ isLoading = false, pendingAction, onPendingActionConsumed }: LoansPageProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<LoanStatusFilter>('ALL');
  const [isBorrowOpen, setIsBorrowOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>('dueAt');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modals
  const [confirmLoan, setConfirmLoan] = useState<Loan | null>(null);
  const [feeTargetLoan, setFeeTargetLoan] = useState<Loan | null>(null);
  const [feeMode, setFeeMode] = useState<FeeModalMode>('return');
  const [isFeeSubmitting, setIsFeeSubmitting] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);
  const [suspendLoan, setSuspendLoan] = useState<Loan | null>(null);

  // Auto-unblock notification
  const [autoUnblockedReader, setAutoUnblockedReader] = useState<string | null>(null);

  const readersById = useMemo(() => new Map(readers.map((r) => [r.id, r])), [readers]);
  const booksById = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);

  const overdue = useMemo(() =>
    loans.filter((l) => getEffectiveStatus(l) === 'OVERDUE')
      .sort((a, b) => calcDaysOverdue(b.dueAt) - calcDaysOverdue(a.dueAt)),
    [loans]
  );
  const top3Overdue = overdue.slice(0, 3);

  // Filter by status, then by search query, then sort
  const filteredAndSorted = useMemo(() => {
    const statusFiltered = loans.filter((l) => statusFilter === 'ALL' || getEffectiveStatus(l) === statusFilter);

    const q = searchQuery.trim().toLowerCase();
    const searched = q.length === 0 ? statusFiltered : statusFiltered.filter((l) => {
      const r = readersById.get(l.readerId);
      const b = booksById.get(l.bookId);
      const haystack = [
        r?.firstName, r?.lastName,
        r ? r.firstName + ' ' + r.lastName : '',
        b?.title,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });

    return [...searched].sort((a, b) => {
      let cmp = 0;
      const rA = readersById.get(a.readerId);
      const rB = readersById.get(b.readerId);
      const bkA = booksById.get(a.bookId);
      const bkB = booksById.get(b.bookId);

      if (sortKey === 'reader') {
        const nA = rA ? rA.lastName + rA.firstName : a.readerId;
        const nB = rB ? rB.lastName + rB.firstName : b.readerId;
        cmp = nA.localeCompare(nB, 'pl');
      } else if (sortKey === 'book') {
        cmp = (bkA?.title ?? a.bookId).localeCompare(bkB?.title ?? b.bookId, 'pl');
      } else if (sortKey === 'borrowedAt') {
        cmp = a.borrowedAt.localeCompare(b.borrowedAt);
      } else if (sortKey === 'dueAt') {
        cmp = a.dueAt.localeCompare(b.dueAt);
      } else if (sortKey === 'returnedAt') {
        const ra = a.returnedAt ?? '';
        const rb = b.returnedAt ?? '';
        cmp = ra.localeCompare(rb);
      }

      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [loans, statusFilter, searchQuery, sortKey, sortDir, readersById, booksById]);

  const totalPages = getTotalPages(filteredAndSorted.length, pageSize);
  const pagedLoans = paginateItems(filteredAndSorted, page, pageSize);

  const fetchAll = async () => {
    setIsFetching(true); setApiError(null);
    try {
      const [l, r, b] = await Promise.all([apiClient.loans.list(), apiClient.readers.list(), apiClient.books.list({})]);
      setLoans(l); setReaders(r); setBooks(b);
    } catch (err) {
      console.error(err);
      setApiError('Nie udało się pobrać danych. Sprawdź połączenie z API.');
    } finally { setIsFetching(false); }
  };

  useEffect(() => { fetchAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset page on filter/sort/search change
  useEffect(() => { setPage(1); }, [statusFilter, sortKey, sortDir, searchQuery]);
  useEffect(() => { if (page > totalPages) setPage(Math.max(1, totalPages)); }, [page, totalPages]);

  // Auto-sort by days overdue (dueAt asc = oldest = most overdue) when OVERDUE filter is selected
  useEffect(() => {
    if (statusFilter === 'OVERDUE') { setSortKey('dueAt'); setSortDir('asc'); }
  }, [statusFilter]);

  // Quick actions from global panel
  useEffect(() => {
    if (pendingAction === 'new-loan') { onPendingActionConsumed?.(); setIsBorrowOpen(true); }
    if (pendingAction === 'scan-return') { onPendingActionConsumed?.(); setIsReturnOpen(true); }
  }, [pendingAction]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) { setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); }
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sortIcon = (key: SortKey) =>
    sortKey !== key ? ' ↕' : sortDir === 'asc' ? ' ↑' : ' ↓';

  const handleReturn = (loan: Loan) => {
    setIsReturnOpen(false);
    if (getEffectiveStatus(loan) === 'OVERDUE') {
      setFeeError(null); setFeeMode('return'); setFeeTargetLoan(loan);
    } else { setConfirmLoan(loan); }
  };

  const handleExtend = (loan: Loan) => { setFeeError(null); setFeeMode('extend'); setFeeTargetLoan(loan); };
  const handleSuspendReader = (loan: Loan) => { setSuspendLoan(loan); };

  // Auto-unblock: if SUSPENDED reader has no more OVERDUE loans after return
  // Active (in-time) loans are fine — only overdue ones warrant suspension
  const checkAndAutoUnblock = async (returnedLoanId: string, readerId: string) => {
    const reader = readersById.get(readerId);
    if (!reader || reader.status !== 'SUSPENDED') return;

    const remainingOverdue = loans.filter(
      (l) => l.readerId === readerId && l.id !== returnedLoanId && getEffectiveStatus(l) === 'OVERDUE'
    );
    if (remainingOverdue.length === 0) {
      try {
        await apiClient.readers.update(readerId, { status: 'ACTIVE' });
        setAutoUnblockedReader(`${reader.firstName} ${reader.lastName}`);
      } catch { /* ignore — manual unblock still available */ }
    }
  };

  const handleFeeConfirm = async () => {
    if (!feeTargetLoan) return;
    setIsFeeSubmitting(true); setFeeError(null);
    try {
      if (feeMode === 'return') {
        await apiClient.loans.return(feeTargetLoan.id);
        await checkAndAutoUnblock(feeTargetLoan.id, feeTargetLoan.readerId);
      } else {
        await apiClient.loans.extend(feeTargetLoan.id, 7);
      }
      setFeeTargetLoan(null); fetchAll();
    } catch (err) { setFeeError((err as Error).message); }
    finally { setIsFeeSubmitting(false); }
  };

  const handleConfirmReturnSuccess = async (loan: Loan) => {
    setConfirmLoan(null);
    await checkAndAutoUnblock(loan.id, loan.readerId);
    fetchAll();
  };

  if (isLoading) {
    return (
      <section className="module-page" aria-busy="true">
        <article className="module-card">
          <div className="skeleton skeleton-line skeleton-heading" />
          <div className="skeleton skeleton-line skeleton-paragraph" />
          <div className="skeleton skeleton-line skeleton-paragraph" />
        </article>
      </section>
    );
  }

  return (
    <section className="module-page" aria-labelledby="loans-title">

      {/* Header */}
      <header className="module-page-head loans-header">
        <div>
          <p className="module-kicker">Wypożyczenia</p>
          <h1 id="loans-title">Obsługa wypożyczyń i zwrotów</h1>
          <p>Widok operacyjny bibliotekarza: ruch książek i terminowość zwrotów.</p>
        </div>
        <div className="loans-header-actions">
          <button type="button" id="btn-new-loan" className="ui-btn ui-btn--primary ui-btn--pill" onClick={() => setIsBorrowOpen(true)}>
            + Nowe wypożyczenie
          </button>
          <button type="button" id="btn-return" className="ui-btn ui-btn--secondary ui-btn--pill" onClick={() => setIsReturnOpen(true)}>
            ↩ Skanuj zwrot
          </button>
        </div>
      </header>

      {/* Auto-unblock notification */}
      {autoUnblockedReader && (
        <div
          role="status"
          aria-live="polite"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
            background: '#edfaf3', border: '1px solid #a3dfc0', borderRadius: 12,
            padding: '0.65rem 1rem', marginBottom: '0.25rem',
            fontSize: 'var(--text-sm)', color: '#0c5e35',
          }}
        >
          <span>
            ✅ <strong>{autoUnblockedReader}</strong> — konto automatycznie odblokowane (brak aktywnych wypożyczeń).
          </span>
          <button
            type="button"
            onClick={() => setAutoUnblockedReader(null)}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#0c5e35', fontSize: '1.1rem', lineHeight: 1, padding: 0 }}
            aria-label="Zamknij powiadomienie"
          >
            ×
          </button>
        </div>
      )}

      {/* Top-3 overdue */}
      {overdue.length > 0 && (
        <article className="loans-overdue-card" aria-label="Alerty zaległości">
          <div className="loans-overdue-head">
            <span className="loans-overdue-icon" aria-hidden="true">⚠️</span>
            <h2>Przekroczone terminy zwrotu</h2>
            <span className="loans-overdue-badge">{overdue.length}</span>
          </div>
          <ul className="loans-overdue-list">
            {top3Overdue.map((loan) => {
              const reader = readersById.get(loan.readerId);
              const book = booksById.get(loan.bookId);
              const days = calcDaysOverdue(loan.dueAt);
              const isSuspended = reader?.status === 'SUSPENDED';
              return (
                <li key={loan.id} className="loans-overdue-row">
                  <div className="loans-overdue-info">
                    <p className="loans-overdue-reader">
                      {reader ? reader.firstName + ' ' + reader.lastName : loan.readerId}
                      {isSuspended && <span className="loans-suspended-badge" style={{ marginLeft: '0.4rem' }}>zawieszone</span>}
                    </p>
                    <p className="loans-overdue-book">{book ? book.title : loan.bookId}</p>
                  </div>
                  <div className="loans-overdue-row-actions">
                    <span className="loans-overdue-days">+{days} {days === 1 ? 'dzień' : 'dni'}</span>
                    <button type="button" className="loans-return-btn" onClick={() => handleReturn(loan)}>Zwróć</button>
                    <button type="button" className="loans-return-btn loans-extend-btn loans-extend-btn--overdue" onClick={() => handleExtend(loan)}>+7 dni</button>
                    {!isSuspended && (
                      <button type="button" className="loans-return-btn" style={{ borderColor: '#f0c5a8', background: '#fff4ec', color: '#7a3410' }} onClick={() => handleSuspendReader(loan)} title="Zawieś konto czytelnika">🔒</button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {overdue.length > 3 && (
            <div className="loans-overdue-expand">
              <span className="loans-overdue-expand-btn">Pozostałych {overdue.length - 3} — skorzystaj z filtra „Po terminie” w tabeli poniżej</span>
            </div>
          )}
        </article>
      )}

      <div className="module-state-row" role="status" aria-live="polite">
        <p>
          {searchQuery.trim()
            ? `Wyniki wyszukiwania: ${filteredAndSorted.length} z ${loans.length}`
            : statusFilter === 'ALL'
              ? 'Wszystkie transakcje: ' + loans.length
              : 'Filtr aktywny: ' + filteredAndSorted.length + ' z ' + loans.length}
        </p>
        <div className="loans-filter-bar" role="group" aria-label="Filtr statusu">
          {(['ALL', 'ACTIVE', 'OVERDUE', 'RETURNED'] as LoanStatusFilter[]).map((s) => (
            <button key={s} type="button" id={'loans-filter-' + s.toLowerCase()}
              className={'loans-tab' + (statusFilter === s ? ' is-active' : '')}
              onClick={() => setStatusFilter(s)} aria-pressed={statusFilter === s}>
              {s === 'ALL' ? 'Wszystkie' : s === 'ACTIVE' ? 'Aktywne' : s === 'OVERDUE' ? 'Po terminie' : 'Zwrócone'}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
          <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-soft)', pointerEvents: 'none', fontSize: '0.9rem' }}>🔍</span>
          <input
            id="loans-search"
            type="text"
            className="ui-input"
            style={{ paddingLeft: '2rem', paddingRight: searchQuery ? '2rem' : undefined }}
            placeholder="Szukaj po imieniu, nazwisku lub tytule…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            aria-label="Wyszukaj wypożyczenie"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Wyczyść wyszukiwanie"
              style={{ position: 'absolute', right: '0.55rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-soft)', fontSize: '1rem', lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {apiError && (
        <article className="module-card" role="alert">
          <h3 style={{ margin: '0 0 0.4rem', color: '#8d4318' }}>Błąd pobierania danych</h3>
          <p style={{ margin: '0 0 0.7rem', color: 'var(--ink-soft)', fontSize: 'var(--text-sm)' }}>{apiError}</p>
          <button type="button" className="ui-btn ui-btn--secondary" onClick={fetchAll}>Spróbuj ponownie</button>
        </article>
      )}

      {/* Transactions table */}
      {!apiError && (
        <article className="module-card">
          <h2>Historia operacji</h2>
          {isFetching ? (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {[1,2,3].map((i) => <div key={i} className="skeleton skeleton-line skeleton-paragraph" />)}
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="loans-empty" role="status">
              <span className="loans-empty-icon" aria-hidden="true">📋</span>
              <p>{statusFilter === 'ALL' ? 'Brak transakcji.' : 'Brak transakcji pasujących do wybranego filtra.'}</p>
            </div>
          ) : (
            <>
              <div className="loans-table-wrap">
                <table className="loans-table" aria-label="Lista wypożyczyń">
                  <thead>
                    <tr>
                      {([
                        ['reader', 'Czytelnik'],
                        ['book', 'Tytuł'],
                        ['borrowedAt', 'Wypożyczono'],
                        ['dueAt', 'Termin'],
                        ['returnedAt', 'Zwrócono'],
                      ] as [SortKey, string][]).map(([key, label]) => (
                        <th key={key} scope="col" style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                          onClick={() => toggleSort(key)}
                          aria-sort={sortKey === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          {label}<span aria-hidden="true" style={{ fontSize: '0.7rem', marginLeft: '0.2rem', opacity: sortKey === key ? 1 : 0.4 }}>{sortIcon(key)}</span>
                        </th>
                      ))}
                      <th scope="col" style={{ whiteSpace: 'nowrap' }}>Status</th>
                      <th scope="col">Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedLoans.map((loan) => (
                      <LoanRow
                        key={loan.id}
                        loan={loan}
                        reader={readersById.get(loan.readerId)}
                        book={booksById.get(loan.bookId)}
                        onReturn={handleReturn}
                        onExtend={handleExtend}
                        onSuspendReader={handleSuspendReader}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <SmartPagination
                label="Wypożyczenia"
                totalItems={filteredAndSorted.length}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(next) => { setPageSize(next); setPage(1); }}
                pageSizeOptions={[10, 15, 25, 50]}
              />
            </>
          )}
        </article>
      )}

      <BorrowFormModal isOpen={isBorrowOpen} onClose={() => setIsBorrowOpen(false)} onSuccess={fetchAll} readers={readers} books={books} />
      <ReturnModal isOpen={isReturnOpen} onClose={() => setIsReturnOpen(false)} onSelect={handleReturn} loans={loans} readers={readers} books={books} />

      <ConfirmReturnModal
        isOpen={confirmLoan !== null} onClose={() => setConfirmLoan(null)}
        onSuccess={() => confirmLoan && handleConfirmReturnSuccess(confirmLoan)}
        loan={confirmLoan}
        book={confirmLoan ? booksById.get(confirmLoan.bookId) : undefined}
        reader={confirmLoan ? readersById.get(confirmLoan.readerId) : undefined}
      />

      <FeeModal
        isOpen={feeTargetLoan !== null} onClose={() => { setFeeTargetLoan(null); setFeeError(null); }}
        onConfirm={handleFeeConfirm} mode={feeMode} loan={feeTargetLoan}
        book={feeTargetLoan ? booksById.get(feeTargetLoan.bookId) : undefined}
        reader={feeTargetLoan ? readersById.get(feeTargetLoan.readerId) : undefined}
        isSubmitting={isFeeSubmitting} error={feeError}
      />

      <SuspendReaderModal
        isOpen={suspendLoan !== null} onClose={() => setSuspendLoan(null)}
        onSuccess={() => { setSuspendLoan(null); fetchAll(); }}
        loan={suspendLoan}
        book={suspendLoan ? booksById.get(suspendLoan.bookId) : undefined}
        reader={suspendLoan ? readersById.get(suspendLoan.readerId) : undefined}
      />
    </section>
  );
}
