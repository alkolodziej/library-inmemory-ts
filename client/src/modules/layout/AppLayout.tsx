import { useEffect, useState, type ReactNode } from "react";
import { BookPlus, Focus, ScanLine, UserRoundPlus, WandSparkles, X } from "lucide-react";
import { Sidebar, type SidebarItemId } from "../dashboard/components/Sidebar";
import "./layout.css";

type AppLayoutProps = {
  activeItem: SidebarItemId;
  onNavigate: (item: SidebarItemId) => void;
  children: ReactNode;
};

const sectionDetails: Record<SidebarItemId, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Przeglad stanu biblioteki",
  },
  readers: {
    title: "Czytelnicy",
    subtitle: "Karty czytelnikow i status kont",
  },
  catalog: {
    title: "Katalog",
    subtitle: "Zasoby i dostepnosc egzemplarzy",
  },
  loans: {
    title: "Wypozyczenia",
    subtitle: "Obsluga ruchu i terminow",
  },
};

export function AppLayout({ activeItem, onNavigate, children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickSheetOpen, setIsQuickSheetOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const section = sectionDetails[activeItem];
  const todayLabel = new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
        setIsQuickSheetOpen(false);
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  return (
    <div className="layout-shell">
      <Sidebar
        id="main-sidebar"
        activeItem={activeItem}
        onNavigate={(item) => {
          setIsSidebarOpen(false);
          setIsQuickSheetOpen(false);
          onNavigate(item);
        }}
        isOpen={isSidebarOpen}
      />

      <button
        type="button"
        className={`sidebar-backdrop ${isSidebarOpen ? "is-open" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-label="Zamknij menu"
      />

      <button
        type="button"
        className={`quick-sheet-backdrop ${isQuickSheetOpen ? "is-open" : ""}`}
        onClick={() => setIsQuickSheetOpen(false)}
        aria-label="Zamknij szybkie akcje"
      />

      <main className="layout-content">
        <header className="context-bar" aria-label="Nawigacja kontekstowa">
          <div className="context-main">
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() => setIsSidebarOpen((current) => !current)}
              aria-expanded={isSidebarOpen}
              aria-controls="main-sidebar"
            >
              Menu
            </button>
            <p className="breadcrumbs">System biblioteki / {section.title}</p>
            <h1>{section.title}</h1>
            <p className="context-subtitle">{section.subtitle}</p>
          </div>

          <div className="context-meta">
            <p className="context-day">{todayLabel}</p>
            <div className="context-actions" aria-label="Szybkie akcje">
              <button
                type="button"
                className={`context-action-toggle ${isFocusMode ? "is-active" : ""}`}
                onClick={() => setIsFocusMode((current) => !current)}
                aria-pressed={isFocusMode}
              >
                <Focus size={15} strokeWidth={2.1} aria-hidden="true" />
                Tryb skupienia
              </button>

              <button
                type="button"
                className="context-action-primary"
                onClick={() => setIsQuickSheetOpen((current) => !current)}
                aria-expanded={isQuickSheetOpen}
                aria-controls="quick-sheet"
              >
                <WandSparkles size={15} strokeWidth={2.1} aria-hidden="true" />
                Szybkie akcje
              </button>
            </div>
          </div>
        </header>

        <section
          id="quick-sheet"
          className={`quick-sheet ${isQuickSheetOpen ? "is-open" : ""}`}
          aria-label="Panel szybkich akcji"
        >
          <header>
            <h2>Szybkie akcje</h2>
            <button type="button" onClick={() => setIsQuickSheetOpen(false)} aria-label="Zamknij panel">
              <X size={14} strokeWidth={2.2} aria-hidden="true" />
              Zamknij
            </button>
          </header>

          <div className="quick-sheet-grid">
            <button type="button"><BookPlus size={15} strokeWidth={2.1} aria-hidden="true" />Nowe wypozyczenie</button>
            <button type="button"><ScanLine size={15} strokeWidth={2.1} aria-hidden="true" />Skanuj zwrot</button>
            <button type="button"><UserRoundPlus size={15} strokeWidth={2.1} aria-hidden="true" />Dodaj czytelnika</button>
            <button type="button"><BookPlus size={15} strokeWidth={2.1} aria-hidden="true" />Dodaj tytul</button>
          </div>
        </section>

        <div className={`content-frame ${isFocusMode ? "is-focus-mode" : ""}`}>{children}</div>
      </main>
    </div>
  );
}
