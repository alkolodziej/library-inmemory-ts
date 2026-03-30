import type { KpiCard } from "../data";

type KpiGridProps = {
  cards: KpiCard[];
  isLoading?: boolean;
};

export function KpiGrid({ cards, isLoading = false }: KpiGridProps) {
  if (isLoading) {
    return (
      <section className="kpi-grid" aria-label="Statystyki kluczowe w trakcie ladowania">
        {Array.from({ length: 4 }).map((_, index) => (
          <article key={`kpi-skeleton-${index}`} className="kpi-card">
            <div className="skeleton skeleton-line skeleton-label" />
            <div className="skeleton skeleton-line skeleton-value" />
            <div className="skeleton skeleton-line skeleton-trend" />
          </article>
        ))}
      </section>
    );
  }

  return (
    <section className="kpi-grid" aria-label="Statystyki kluczowe">
      {cards.map((card) => (
        <article key={card.label} className={`kpi-card kpi-${card.tone}`}>
          <p className="kpi-label">{card.label}</p>
          <p className="kpi-value">{card.value}</p>
          <p className="kpi-trend">{card.trend}</p>
        </article>
      ))}
    </section>
  );
}
