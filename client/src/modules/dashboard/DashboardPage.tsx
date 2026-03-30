import { kpiCards, overdueAlerts, recentActivity } from "./data";
import { ActivityPanel } from "./components/ActivityPanel";
import { AlertsPanel } from "./components/AlertsPanel";
import { DashboardHeader } from "./components/DashboardHeader";
import { KpiGrid } from "./components/KpiGrid";

type DashboardPageProps = {
  isLoading?: boolean;
};

export function DashboardPage({ isLoading = false }: DashboardPageProps) {
  return (
    <section className="dash" aria-label="Dashboard biblioteki">
      <DashboardHeader />
      <KpiGrid cards={kpiCards} isLoading={isLoading} />

      <section className="content-grid">
        <AlertsPanel alerts={overdueAlerts} isLoading={isLoading} />
        <ActivityPanel rows={recentActivity} isLoading={isLoading} />
      </section>
    </section>
  );
}
