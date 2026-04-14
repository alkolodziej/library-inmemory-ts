type LoansPageProps = {
  isLoading?: boolean;
};

export function LoansPage({ isLoading = false }: LoansPageProps) {
  if (isLoading) {
    return (
      <section className="module-page" aria-busy="true">
        <article className="module-card">
          <div className="skeleton skeleton-line skeleton-heading" />
          <div className="skeleton skeleton-line skeleton-paragraph" />
          <div className="skeleton skeleton-line skeleton-paragraph" />
          <div className="skeleton skeleton-line skeleton-paragraph" />
        </article>
      </section>
    );
  }

  return (
    <section className="module-page" aria-labelledby="loans-title">
      <header className="module-page-head">
        <p className="module-kicker">Wypozyczenia</p>
        <h1 id="loans-title">Obsluga wypozyczen i zwrotow</h1>
        <p>Widok MVP pod codzienna prace bibliotekarza: ruch ksiazek i terminowosc zwrotow.</p>
      </header>

      <div className="module-state-row" role="status" aria-live="polite">
        <p>Modul jest gotowy do kolejnego sprintu funkcjonalnego. UI akcji jest juz zgodne z reszta aplikacji.</p>
        <button type="button" className="ui-btn ui-btn--compact ui-btn--ghost">Przejdz do planu MVP</button>
      </div>

      <article className="module-card">
        <h2>Strefa operacyjna</h2>
        <p className="dash-subtitle">Najczestsze akcje sa juz zgrupowane. Kolejny krok to podpiecie ich do endpointow wypozyczen.</p>
        <div className="context-actions" role="group" aria-label="Akcje wypozyczen">
          <button type="button" className="ui-btn ui-btn--primary ui-btn--pill">Nowe wypozyczenie</button>
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--pill">Skanuj zwrot</button>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--pill">Historia operacji</button>
        </div>
        <ul>
          <li>formularz wypozyczenia i zwrotu,</li>
          <li>historia operacji dla czytelnika,</li>
          <li>alerty przekroczonych terminow.</li>
        </ul>
      </article>

      <article className="empty-state" role="status" aria-live="polite">
        <span className="empty-state-icon" aria-hidden="true">○</span>
        <h3>Brak transakcji w podgladzie</h3>
        <p>Po podpieciu API lista ostatnich wypozyczen i zwrotow pojawi sie tutaj wraz z szybkim filtrem statusu.</p>
      </article>
    </section>
  );
}
