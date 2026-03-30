import type { ActivityItem } from "../data";
import { EmptyState } from "./EmptyState";

type ActivityPanelProps = {
  rows: ActivityItem[];
  isLoading?: boolean;
};

export function ActivityPanel({ rows, isLoading = false }: ActivityPanelProps) {
  if (isLoading) {
    return (
      <article className="panel activity-panel" aria-busy="true">
        <div className="panel-head">
          <h2>Ostatnia aktywnosc</h2>
        </div>

        <div className="activity-scroll">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Operacja</th>
                <th>Uzytkownik</th>
                <th>Godzina</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 4 }).map((_, index) => (
                <tr key={`activity-skeleton-${index}`}>
                  <td><div className="skeleton skeleton-line skeleton-table" /></td>
                  <td><div className="skeleton skeleton-line skeleton-table" /></td>
                  <td><div className="skeleton skeleton-line skeleton-time" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    );
  }

  const hasRows = rows.length > 0;

  return (
    <article className="panel activity-panel">
      <div className="panel-head">
        <h2>Ostatnia aktywnosc</h2>
      </div>

      {hasRows ?
        <div className="activity-scroll">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Operacja</th>
                <th>Uzytkownik</th>
                <th>Godzina</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td>{item.action}</td>
                  <td>{item.actor}</td>
                  <td>{item.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      :
        <EmptyState
          title="Brak aktywnosci"
          description="Historia operacji pojawi sie tutaj, gdy uzytkownicy zaczna wykonywac akcje."
        />}
    </article>
  );
}
