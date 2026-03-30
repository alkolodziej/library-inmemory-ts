type CatalogPageProps = {
  isLoading?: boolean;
};

export function CatalogPage({ isLoading = false }: CatalogPageProps) {
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
    <section className="module-page" aria-labelledby="catalog-title">
      <header className="module-page-head">
        <p className="module-kicker">Katalog</p>
        <h1 id="catalog-title">Przeglad zbiorow</h1>
        <p>Widok MVP pod katalog ksiazek, egzemplarze i podstawowe operacje biblioteczne.</p>
      </header>

      <article className="module-card">
        <h2>Co dalej w tym module</h2>
        <ul>
          <li>wyszukiwanie po tytule, autorze i ISBN,</li>
          <li>status egzemplarzy i dostepnosc,</li>
          <li>panel dodawania nowego tytulu.</li>
        </ul>
      </article>
    </section>
  );
}
