import { useMemo, useState } from "react";
import type { AlertItem } from "../data";
import { SmartPagination } from "../../../components/pagination/SmartPagination";
import { paginateItems } from "../../../components/pagination/paginationUtils";
import { EmptyState } from "./EmptyState";

type AlertsPanelProps = {
  alerts: AlertItem[];
  isLoading?: boolean;
};

export function AlertsPanel({ alerts, isLoading = false }: AlertsPanelProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);
  const pagedAlerts = useMemo(() => paginateItems(alerts, page, pageSize), [alerts, page, pageSize]);

  if (isLoading) {
    return (
      <article className="panel alerts-panel" aria-busy="true">
        <div className="panel-head">
          <h2>Alerty przetrzyman</h2>
          <span className="panel-badge">...</span>
        </div>

        <ul className="alerts-list">
          {Array.from({ length: 3 }).map((_, index) => (
            <li key={`alert-skeleton-${index}`} className="alert-row">
              <div className="alert-body-skeleton">
                <div className="skeleton skeleton-line skeleton-reader" />
                <div className="skeleton skeleton-line skeleton-book" />
              </div>
              <div className="skeleton skeleton-pill" />
            </li>
          ))}
        </ul>
      </article>
    );
  }

  const hasAlerts = alerts.length > 0;

  return (
    <article className="panel alerts-panel">
      <div className="panel-head">
        <h2>Alerty przetrzyman</h2>
        <span className="panel-badge">{alerts.length}</span>
      </div>

      {hasAlerts ?
        <>
          <ul className="alerts-list">
            {pagedAlerts.map((alert) => (
              <li key={alert.id} className="alert-row">
                <div>
                  <p className="alert-reader">{alert.reader}</p>
                  <p className="alert-book">{alert.book}</p>
                </div>
                <p className="alert-days">{alert.lateDays} dni</p>
              </li>
            ))}
          </ul>

          <SmartPagination
            compact
            label="Alerty"
            totalItems={alerts.length}
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
          title="Brak alertow"
          description="Aktualnie nie ma przetrzymanych wypozyczen. Wszystkie terminy sa pod kontrola."
        />}
    </article>
  );
}
