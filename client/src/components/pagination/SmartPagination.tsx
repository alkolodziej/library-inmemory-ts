import { useMemo } from "react";
import { getTotalPages } from "./paginationUtils";

type SmartPaginationProps = {
  totalItems: number;
  page: number;
  pageSize: number;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (nextPageSize: number) => void;
  pageSizeOptions?: number[];
  label?: string;
  compact?: boolean;
};

type PaginationToken = number | "ellipsis-left" | "ellipsis-right";

function clampPage(value: number, totalPages: number): number {
  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }

  if (value > totalPages) {
    return totalPages;
  }

  return value;
}

function getVisibleTokens(page: number, totalPages: number): PaginationToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const tokens: PaginationToken[] = [1];

  if (page > 3) {
    tokens.push("ellipsis-left");
  }

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let value = start; value <= end; value += 1) {
    tokens.push(value);
  }

  if (page < totalPages - 2) {
    tokens.push("ellipsis-right");
  }

  tokens.push(totalPages);
  return tokens;
}

export function SmartPagination({
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [8, 12, 24],
  label = "Wyniki",
  compact = false,
}: SmartPaginationProps) {
  const totalPages = getTotalPages(totalItems, pageSize);
  const safePage = clampPage(page, totalPages);

  const from = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = totalItems === 0 ? 0 : Math.min(safePage * pageSize, totalItems);
  const progress = totalItems === 0 ? 0 : Math.min(100, Math.round((to / totalItems) * 100));

  const tokens = useMemo(() => getVisibleTokens(safePage, totalPages), [safePage, totalPages]);

  const rootClass = compact ? "smart-pagination smart-pagination--compact" : "smart-pagination";

  return (
    <nav className={rootClass} aria-label={`${label} - paginacja`}>
      <div className="smart-pagination-meta" role="status" aria-live="polite">
        <p>{label}: {from}-{to} z {totalItems}</p>
        <div className="smart-pagination-progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="smart-pagination-controls">
        <div className="smart-pagination-nav" role="group" aria-label="Nawigacja stron">
          <button
            type="button"
            className="ui-btn ui-btn--compact ui-btn--ghost"
            onClick={() => onPageChange(1)}
            disabled={safePage === 1}
          >
            Pierwsza
          </button>
          <button
            type="button"
            className="ui-btn ui-btn--compact ui-btn--secondary"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage === 1}
          >
            Wstecz
          </button>

          <div className="smart-pagination-pages" aria-label="Numery stron">
            {tokens.map((token) => {
              if (typeof token !== "number") {
                return <span className="smart-pagination-ellipsis" key={token}>...</span>;
              }

              const isActive = token === safePage;

              return (
                <button
                  type="button"
                  key={`page-${token}`}
                  className={`ui-btn ui-btn--compact ${isActive ? "ui-btn--primary" : "ui-btn--ghost"}`}
                  onClick={() => onPageChange(token)}
                  aria-current={isActive ? "page" : undefined}
                >
                  {token}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="ui-btn ui-btn--compact ui-btn--secondary"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage === totalPages}
          >
            Dalej
          </button>
          <button
            type="button"
            className="ui-btn ui-btn--compact ui-btn--ghost"
            onClick={() => onPageChange(totalPages)}
            disabled={safePage === totalPages}
          >
            Ostatnia
          </button>
        </div>

        <label className="smart-pagination-size" htmlFor={`${label}-size`}>
          Na strone
          <select
            id={`${label}-size`}
            className="ui-select"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
    </nav>
  );
}
