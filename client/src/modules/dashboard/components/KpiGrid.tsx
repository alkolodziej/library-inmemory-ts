import type { KpiCard } from "../data";

type KpiGridProps = {
  cards: KpiCard[];
};

export function KpiGrid({ cards }: KpiGridProps) {
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
