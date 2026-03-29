import type { ActivityItem } from "../data";

type ActivityPanelProps = {
  rows: ActivityItem[];
};

export function ActivityPanel({ rows }: ActivityPanelProps) {
  return (
    <article className="panel activity-panel">
      <div className="panel-head">
        <h2>Ostatnia aktywnosc</h2>
      </div>

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
    </article>
  );
}
