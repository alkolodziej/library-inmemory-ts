import type { Book, Reader, Loan, OverviewStats } from "../../../shared/src/models";

const API_BASE = '/api';

export const apiClient = {
  books: {
    list: async (query?: { title?: string; author?: string; category?: string; isbn?: string }): Promise<Book[]> => {
      const url = new URL(`${window.location.origin}${API_BASE}/books`);
      if (query?.title) url.searchParams.append('title', query.title);
      if (query?.author) url.searchParams.append('author', query.author);
      if (query?.category) url.searchParams.append('category', query.category);
      if (query?.isbn) url.searchParams.append('isbn', query.isbn);
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to fetch books');
      return response.json();
    },
    create: async (data: Partial<Book>): Promise<Book> => {
      const response = await fetch(`${API_BASE}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create book");
      return response.json();
    },
    update: async (id: string, data: Partial<Book>): Promise<Book> => {
      const response = await fetch(`${API_BASE}/books/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update book");
      return response.json();
    },
    delete: async (id: string): Promise<void> => {
      const response = await fetch(`${API_BASE}/books/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete book");
      }
    }
  },
  readers: {
    list: async (): Promise<Reader[]> => {
      const response = await fetch(`${API_BASE}/readers`);
      if (!response.ok) throw new Error('Failed to fetch readers');
      return response.json();
    },
    update: async (id: string, data: Partial<Reader>): Promise<Reader> => {
      const response = await fetch(`${API_BASE}/readers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to update reader');
      }
      return response.json();
    },
  },
  loans: {
    list: async (): Promise<Loan[]> => {
      const response = await fetch(`${API_BASE}/loans`);
      if (!response.ok) throw new Error('Failed to fetch loans');
      return response.json();
    },
    borrow: async (data: { readerId: string; bookId: string; days: number }): Promise<Loan> => {
      const response = await fetch(`${API_BASE}/loans/borrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to borrow book');
      }
      return response.json();
    },
    return: async (loanId: string): Promise<Loan> => {
      const response = await fetch(`${API_BASE}/loans/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to return book');
      }
      return response.json();
    },
    extend: async (loanId: string, days = 7): Promise<Loan> => {
      const response = await fetch(`${API_BASE}/loans/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId, days }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to extend loan');
      }
      return response.json();
    },
  },
  reports: {
    overview: async (): Promise<OverviewStats> => {
      const response = await fetch(`${API_BASE}/reports/overview`);
      if (!response.ok) throw new Error('Failed to fetch overview stats');
      return response.json();
    },
    overdue: async (): Promise<Loan[]> => {
      const response = await fetch(`${API_BASE}/reports/overdue`);
      if (!response.ok) throw new Error('Failed to fetch overdue loans');
      return response.json();
    },
  }
};
