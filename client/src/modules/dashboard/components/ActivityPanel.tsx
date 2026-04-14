import { useMemo, useState } from "react";
import type { ActivityItem } from "../data";
import { SmartPagination } from "../../../components/pagination/SmartPagination";
import { paginateItems } from "../../../components/pagination/paginationUtils";
import { EmptyState } from "./EmptyState";

type ActivityPanelProps = {
  rows: ActivityItem[];
  isLoading?: boolean;
};

export function ActivityPanel({ rows, isLoading = false }: ActivityPanelProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);
  const pagedRows = useMemo(() => paginateItems(rows, page, pageSize), [rows, page, pageSize]);

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
        <>
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
                {pagedRows.map((item) => (
                  <tr key={item.id}>
                    <td>{item.action}</td>
                    <td>{item.actor}</td>
                    <td>{item.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SmartPagination
            compact
            label="Aktywnosc"
            totalItems={rows.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(next) => {
              setPageSize(next);
              setPage(1);
            }}
            pageSizeOptions={[4, 8, 12]}
          />
        </>
      :
        <EmptyState
          title="Brak aktywnosci"
          description="Historia operacji pojawi sie tutaj, gdy uzytkownicy zaczna wykonywac akcje."
        />}
    </article>
  );
}
