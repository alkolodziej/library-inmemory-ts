import {
  BookCopy,
  ChartNoAxesCombined,
  Handshake,
  type LucideIcon,
  UserRound,
} from "lucide-react";

export type SidebarItemId = "dashboard" | "readers" | "catalog" | "loans";

type SidebarProps = {
  id?: string;
  activeItem: SidebarItemId;
  onNavigate: (item: SidebarItemId) => void;
  isOpen?: boolean;
};

const navItems: Array<{ id: SidebarItemId; label: string; note: string; icon: LucideIcon }> = [
  { id: "dashboard", label: "Dashboard", note: "Podsumowanie", icon: ChartNoAxesCombined },
  { id: "readers", label: "Czytelnicy", note: "Karty i statusy", icon: UserRound },
  { id: "catalog", label: "Katalog", note: "Tytuly i egzemplarze", icon: BookCopy },
  { id: "loans", label: "Wypozyczenia", note: "Ruch i zwroty", icon: Handshake },
];

export function Sidebar({ id, activeItem, onNavigate, isOpen = false }: SidebarProps) {
  return (
    <aside id={id} className={`app-sidebar ${isOpen ? "is-open" : ""}`} aria-label="Nawigacja glowna">
      <div className="brand-box">
        <p className="brand-mark">PSK</p>
        <div>
          <p className="brand-name">Biblioteka Miejska</p>
          <p className="brand-sub">panel operacyjny</p>
        </div>
      </div>

      <nav>
        <ul className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = item.id === activeItem;
            const ItemIcon = item.icon;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`sidebar-link ${isActive ? "is-active" : ""}`}
                  onClick={() => onNavigate(item.id)}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="sidebar-main">
                    <ItemIcon size={16} strokeWidth={2.1} aria-hidden="true" />
                    <span className="sidebar-label">{item.label}</span>
                  </span>
                  <span className="sidebar-note">{item.note}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
