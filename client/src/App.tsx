import { useEffect, useRef, useState } from "react";
import { CatalogPage } from "./modules/catalog/CatalogPage";
import { DashboardPage } from "./modules/dashboard/DashboardPage";
import { type SidebarItemId } from "./modules/dashboard/components/Sidebar";
import { AppLayout } from "./modules/layout/AppLayout";
import { LoansPage } from "./modules/loans/LoansPage";
import { ReadersPage } from "./modules/readers/ReadersPage";
import "./modules/dashboard/dashboard.css";
import "./styles/ui.css";

const defaultSection: SidebarItemId = "dashboard";

function getSectionFromHash(hash: string): SidebarItemId {
  const value = hash.replace("#", "").trim();

  if (value === "dashboard" || value === "readers" || value === "catalog" || value === "loans") {
    return value;
  }

  return defaultSection;
}

function renderPage(section: SidebarItemId, isLoading: boolean) {
  switch (section) {
    case "dashboard":
      return <DashboardPage isLoading={isLoading} />;
    case "readers":
      return <ReadersPage isLoading={isLoading} />;
    case "catalog":
      return <CatalogPage isLoading={isLoading} />;
    case "loans":
      return <LoansPage isLoading={isLoading} />;
    default:
      return <DashboardPage isLoading={isLoading} />;
  }
}

function App() {
  const [activeSection, setActiveSection] = useState<SidebarItemId>(() =>
    getSectionFromHash(window.location.hash),
  );
  const [isPageLoading, setIsPageLoading] = useState(false);
  const transitionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const finishTransition = () => {
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }

      transitionTimeoutRef.current = window.setTimeout(() => {
        setIsPageLoading(false);
      }, 260);
    };

    const onHashChange = () => {
      setActiveSection(getSectionFromHash(window.location.hash));
      finishTransition();
    };

    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);

      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const handleNavigate = (nextSection: SidebarItemId) => {
    if (nextSection === activeSection) {
      return;
    }

    setIsPageLoading(true);
    window.location.hash = nextSection;
  };

  return (
    <AppLayout activeItem={activeSection} onNavigate={handleNavigate} isPageTransitioning={isPageLoading}>
      {renderPage(activeSection, isPageLoading)}
    </AppLayout>
  );
}

export default App;
