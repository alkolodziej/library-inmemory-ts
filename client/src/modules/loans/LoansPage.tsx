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

      <article className="module-card">
        <h2>Co dalej w tym module</h2>
        <ul>
          <li>formularz wypozyczenia i zwrotu,</li>
          <li>historia operacji dla czytelnika,</li>
          <li>alerty przekroczonych terminow.</li>
        </ul>
      </article>
    </section>
  );
}
