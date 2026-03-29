import { kpiCards, overdueAlerts, recentActivity } from "./data";
import { ActivityPanel } from "./components/ActivityPanel";
import { AlertsPanel } from "./components/AlertsPanel";
import { DashboardHeader } from "./components/DashboardHeader";
import { KpiGrid } from "./components/KpiGrid";
import { Sidebar } from "./components/Sidebar";
import "./dashboard.css";

export function DashboardPage() {
  return (
    <div className="app-shell">
      <Sidebar activeItem="dashboard" />

      <main className="dash">
        <DashboardHeader />
        <KpiGrid cards={kpiCards} />

        <section className="content-grid">
          <AlertsPanel alerts={overdueAlerts} />
          <ActivityPanel rows={recentActivity} />
        </section>
      </main>
    </div>
  );
}
