import type { AlertItem } from "../data";

type AlertsPanelProps = {
  alerts: AlertItem[];
};

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <article className="panel alerts-panel">
      <div className="panel-head">
        <h2>Alerty przetrzyman</h2>
        <span className="panel-badge">{alerts.length}</span>
      </div>

      <ul className="alerts-list">
        {alerts.map((alert) => (
          <li key={alert.id} className="alert-row">
            <div>
              <p className="alert-reader">{alert.reader}</p>
              <p className="alert-book">{alert.book}</p>
            </div>
            <p className="alert-days">{alert.lateDays} dni</p>
          </li>
        ))}
      </ul>
    </article>
  );
}
