import { useEffect, useRef, useState } from "react";
import { CatalogPage } from "./modules/catalog/CatalogPage";
import { DashboardPage } from "./modules/dashboard/DashboardPage";
import { type SidebarItemId } from "./modules/dashboard/components/Sidebar";
import { AppLayout } from "./modules/layout/AppLayout";
import { LoansPage } from "./modules/loans/LoansPage";
import { ReadersPage } from "./modules/readers/ReadersPage";
import "./modules/dashboard/dashboard.css";
import "./styles/ui.css";

type QuickAction = 'new-loan' | 'scan-return' | 'add-reader' | 'add-book';

const defaultSection: SidebarItemId = "dashboard";

function getSectionFromHash(hash: string): SidebarItemId {
  const value = hash.replace("#", "").trim();
  if (value === "dashboard" || value === "readers" || value === "catalog" || value === "loans") {
    return value;
  }
  return defaultSection;
}

function App() {
  const [activeSection, setActiveSection] = useState<SidebarItemId>(() =>
    getSectionFromHash(window.location.hash),
  );
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<QuickAction | null>(null);
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
    if (nextSection === activeSection) return;
    setIsPageLoading(true);
    window.location.hash = nextSection;
  };

  const handleQuickAction = (action: QuickAction) => {
    const sectionMap: Record<QuickAction, SidebarItemId> = {
      'new-loan': 'loans',
      'scan-return': 'loans',
      'add-reader': 'readers',
      'add-book': 'catalog',
    };
    const target = sectionMap[action];

    if (activeSection !== target) {
      setIsPageLoading(true);
      window.location.hash = target;
      // Wait for page transition before triggering modal
      setTimeout(() => setPendingAction(action), 320);
    } else {
      setPendingAction(action);
    }
  };

  const clearPendingAction = () => setPendingAction(null);

  return (
    <AppLayout
      activeItem={activeSection}
      onNavigate={handleNavigate}
      onQuickAction={handleQuickAction}
      isPageTransitioning={isPageLoading}
    >
      {activeSection === "dashboard" && <DashboardPage isLoading={isPageLoading} />}
      {activeSection === "readers" && (
        <ReadersPage
          isLoading={isPageLoading}
          pendingAction={pendingAction}
          onPendingActionConsumed={clearPendingAction}
        />
      )}
      {activeSection === "catalog" && (
        <CatalogPage
          isLoading={isPageLoading}
          pendingAction={pendingAction}
          onPendingActionConsumed={clearPendingAction}
        />
      )}
      {activeSection === "loans" && (
        <LoansPage
          isLoading={isPageLoading}
          pendingAction={pendingAction}
          onPendingActionConsumed={clearPendingAction}
        />
      )}
    </AppLayout>
  );
}

export default App;
