import { useCallback, useEffect, useMemo, useState } from "react";
import { kpiCards, overdueAlerts, recentActivity } from "./data";
import { ActivityPanel } from "./components/ActivityPanel";
import { AlertsPanel } from "./components/AlertsPanel";
import { DashboardHeader } from "./components/DashboardHeader";
import { KpiGrid } from "./components/KpiGrid";
import type { ActivityItem, AlertItem, KpiCard } from "./data";

type DashboardPageProps = {
  isLoading?: boolean;
};

type OverviewStats = {
  totalBooks: number;
  totalReaders: number;
  activeLoans: number;
  overdueLoans: number;
};

type OverdueLoan = {
  id: string;
  readerId: string;
  bookId: string;
  dueAt: string;
  status: "ACTIVE" | "RETURNED" | "OVERDUE";
};

type ReaderDto = {
  id: string;
  firstName: string;
  lastName: string;
  createdAt: string;
};

type BookDto = {
  id: string;
  title: string;
  availableCopies: number;
};

function getStartOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const shift = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + shift);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatTimeLabel(value: string): string {
  const date = new Date(value);
  return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

export function DashboardPage({ isLoading = false }: DashboardPageProps) {
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [liveKpiCards, setLiveKpiCards] = useState<KpiCard[]>(kpiCards);
  const [liveAlerts, setLiveAlerts] = useState<AlertItem[]>(overdueAlerts);
  const [liveActivity, setLiveActivity] = useState<ActivityItem[]>(recentActivity);

  const loadDashboard = useCallback(async (signal?: AbortSignal) => {
      setApiLoading(true);
      setApiError(null);

      try {
        const [overviewRes, overdueRes, readersRes, booksRes] = await Promise.all([
          fetch("/api/reports/overview", { signal }),
          fetch("/api/reports/overdue", { signal }),
          fetch("/api/readers", { signal }),
          fetch("/api/books", { signal }),
        ]);

        if (!overviewRes.ok || !overdueRes.ok || !readersRes.ok || !booksRes.ok) {
          throw new Error("Nie udalo sie pobrac danych dashboardu z API.");
        }

        const [overview, overdueLoans, readers, books] = await Promise.all([
          overviewRes.json() as Promise<OverviewStats>,
          overdueRes.json() as Promise<OverdueLoan[]>,
          readersRes.json() as Promise<ReaderDto[]>,
          booksRes.json() as Promise<BookDto[]>,
        ]);

        const readerById = new Map(readers.map((reader) => [reader.id, `${reader.firstName} ${reader.lastName}`]));
        const bookById = new Map(books.map((book) => [book.id, book.title]));

        const now = Date.now();
        const startOfWeek = getStartOfWeek(new Date()).getTime();
        const readersThisWeek = readers.filter((reader) => {
          const createdAt = new Date(reader.createdAt).getTime();
          return Number.isFinite(createdAt) && createdAt >= startOfWeek;
        }).length;

        const availableCopies = books.reduce((sum, book) => sum + Math.max(0, book.availableCopies), 0);

        const normalizedAlerts = overdueLoans
          .filter((loan) => loan.status !== "RETURNED")
          .map((loan) => {
            const dueAtMs = new Date(loan.dueAt).getTime();
            const lateDays = Math.max(1, Math.ceil((now - dueAtMs) / (1000 * 60 * 60 * 24)));

            return {
              id: loan.id,
              reader: readerById.get(loan.readerId) ?? `Czytelnik #${loan.readerId.slice(0, 6)}`,
              book: bookById.get(loan.bookId) ?? `Ksiazka #${loan.bookId.slice(0, 6)}`,
              lateDays,
              dueAt: loan.dueAt,
            };
          })
          .sort((a, b) => b.lateDays - a.lateDays);

        const normalizedKpiCards: KpiCard[] = [
          {
            label: "Aktywne wypozyczenia",
            value: String(overview.activeLoans),
            trend: "Na podstawie danych live",
            tone: "good",
          },
          {
            label: "Dostepne egzemplarze",
            value: String(availableCopies),
            trend: `${overview.totalBooks} tytulow w katalogu`,
            tone: "warning",
          },
          {
            label: "Nowi czytelnicy",
            value: String(readersThisWeek),
            trend: "Rejestracje od poniedzialku",
            tone: "good",
          },
          {
            label: "Przetrzymania",
            value: String(overview.overdueLoans),
            trend: "Wymagaja przypomnienia",
            tone: "warning",
          },
        ];

        const normalizedActivity: ActivityItem[] = normalizedAlerts.slice(0, 4).map((alert) => ({
          id: `OV-${alert.id}`,
          action: `Przetrzymanie: ${alert.book}`,
          actor: alert.reader,
          time: formatTimeLabel(alert.dueAt),
        }));

        setLiveKpiCards(normalizedKpiCards);
        setLiveAlerts(normalizedAlerts.map(({ dueAt: _dueAt, ...alert }) => alert));
        setLiveActivity(normalizedActivity);
        setLastSyncedAt(new Date());
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        setApiError("Nie udalo sie pobrac raportow na zywo. Widok pokazuje dane ostatnio dostepne.");
      } finally {
        setApiLoading(false);
      }
    }, []);

  useEffect(() => {
    const controller = new AbortController();

    loadDashboard(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadDashboard]);

  const panelLoading = useMemo(() => isLoading || apiLoading, [isLoading, apiLoading]);

  return (
    <section className="dash" aria-label="Dashboard biblioteki">
      <DashboardHeader />
      <div className="module-state-row" role="status" aria-live="polite">
        <p>
          {lastSyncedAt
            ? `Synchronizacja live: ${lastSyncedAt.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}`
            : "Trwa pierwsza synchronizacja danych live"}
        </p>
        <button
          type="button"
          className="ui-btn ui-btn--compact ui-btn--secondary"
          onClick={() => loadDashboard()}
          disabled={apiLoading}
        >
          Odswiez
        </button>
      </div>
      {apiError ? <p className="dash-warning" role="status">{apiError}</p> : null}
      <KpiGrid cards={liveKpiCards} isLoading={panelLoading} />

      <section className="content-grid">
        <AlertsPanel alerts={liveAlerts} isLoading={panelLoading} />
        <ActivityPanel rows={liveActivity} isLoading={panelLoading} />
      </section>
    </section>
  );
}
