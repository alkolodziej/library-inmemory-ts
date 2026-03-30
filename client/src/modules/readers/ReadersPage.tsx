type ReadersPageProps = {
  isLoading?: boolean;
};

export function ReadersPage({ isLoading = false }: ReadersPageProps) {
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
    <section className="module-page" aria-labelledby="readers-title">
      <header className="module-page-head">
        <p className="module-kicker">Czytelnicy</p>
        <h1 id="readers-title">Zarzadzanie czytelnikami</h1>
        <p>Widok MVP pod dalsze kroki: lista kart, status kont i akcje administracyjne.</p>
      </header>

      <article className="module-card">
        <h2>Co dalej w tym module</h2>
        <ul>
          <li>filtry po statusie konta,</li>
          <li>wyszukiwanie po nazwisku i numerze karty,</li>
          <li>szybkie akcje: blokuj, odblokuj, edytuj dane.</li>
        </ul>
      </article>
    </section>
  );
}
