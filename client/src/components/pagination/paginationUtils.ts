function clampPage(value: number, totalPages: number): number {
  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }

  if (value > totalPages) {
    return totalPages;
  }

  return value;
}

export function getTotalPages(totalItems: number, pageSize: number): number {
  if (pageSize <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function paginateItems<T>(items: T[], page: number, pageSize: number): T[] {
  const totalPages = getTotalPages(items.length, pageSize);
  const safePage = clampPage(page, totalPages);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
