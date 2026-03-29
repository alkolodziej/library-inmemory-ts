type SidebarProps = {
  activeItem: "dashboard" | "readers" | "catalog" | "loans";
};

const navItems: Array<{ id: SidebarProps["activeItem"]; label: string; note: string }> = [
  { id: "dashboard", label: "Dashboard", note: "Podsumowanie" },
  { id: "readers", label: "Czytelnicy", note: "Karty i statusy" },
  { id: "catalog", label: "Katalog", note: "Tytuly i egzemplarze" },
  { id: "loans", label: "Wypozyczenia", note: "Ruch i zwroty" },
];

export function Sidebar({ activeItem }: SidebarProps) {
  return (
    <aside className="app-sidebar" aria-label="Nawigacja glowna">
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

            return (
              <li key={item.id}>
                <button type="button" className={`sidebar-link ${isActive ? "is-active" : ""}`}>
                  <span className="sidebar-label">{item.label}</span>
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
