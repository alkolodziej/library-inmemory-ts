# System Zarzadzania Biblioteka (In-Memory)

## 1) Proponowana struktura katalogow (monorepo)

```txt
projekt-zespolowy/
  client/                     # React + TypeScript (Vite)
    src/
      modules/
        dashboard/
        readers/
        catalog/
        loans/
  server/                     # Node.js + Express + TypeScript
    src/
      api/
        routes/
        controllers/
      db/
        structures/           # autorskie struktury danych (AVL/BST/LinkedList/HashMap)
        DatabaseService.ts    # singleton silnika in-memory + persystencja JSON
      services/               # logika biznesowa (opcjonalnie)
      shared/                 # DTO/API contracts po stronie backendu (opcjonalnie)
      app.ts
      server.ts
    data/                     # pliki JSON z migawka stanu
      books.json
      readers.json
      loans.json
  shared/                     # wspolne typy miedzy client/server
    src/
      models.ts
```

## 2) Podzial prac (2 osoby)

- Osoba 1 (Czytelnicy + statystyki + dashboard):
  - Encja `Reader`, indeksy i CRUD czytelnikow.
  - Raporty globalne i alerty przetrzyman.
  - UI: dashboard + zarzadzanie czytelnikami.
- Osoba 2 (Katalog + wypozyczenia + logika):
  - Encja `Book` + indeksowanie katalogu.
  - Encja `Loan` + procesy wypozycz/zwroc.
  - UI: katalog i operacje wypozyczen.

## 3) Analiza struktur danych (ambitna algorytmicznie)

### Reader
- `HashMap` (`Map<string, Reader>`) po `readerId`: O(1) odczyt, edycja, usuniecie.
- `DoublyLinkedList<string>` dla kolejnosci rejestracji / paginacji bez kosztow przesuniec tablicy.
- `HashMap<string, Set<string>>` dla indeksu po emailu i statusie (aktywny/zablokowany).

### Book
- `HashMap` (`Map<string, Book>`) po `bookId`: O(1) operacje krytyczne biznesowo.
- `AVL/BST` po `title` (klucz znormalizowany): O(log n) wyszukiwanie i zakresy alfabetyczne.
- `HashMap<string, Set<string>>` dla indeksu po autorze, kategorii i ISBN.

### Loan
- `HashMap` (`Map<string, Loan>`) po `loanId`: szybki dostep.
- `HashMap<string, Set<string>>` indeks po `readerId` i `bookId`.
- `AVL/BST` po `dueDate` dla alertow przetrzyman i raportow terminowych.

### Integralnosc relacyjna (manualna)
- Blokada usuniecia czytelnika, gdy ma aktywne wypozyczenia.
- Blokada usuniecia ksiazki, gdy istnieja aktywne wypozyczenia tej ksiazki.
- Walidacja dostepnych egzemplarzy przy wypozyczeniu/zwrocie.

## 4) Proponowane endpointy API

- `GET /api/readers`, `POST /api/readers`, `DELETE /api/readers/:id`
- `GET /api/books`, `POST /api/books`, `DELETE /api/books/:id`
- `POST /api/loans/borrow`, `POST /api/loans/return`
- `GET /api/reports/overview`
- `GET /api/reports/overdue`

## 5) Persystencja i spojnosc

- Start aplikacji: `DatabaseService.loadAll()`.
- Modyfikacja danych: zapis atomowy (`*.tmp` -> rename) przez `saveAll()`.
- Snapshot trzymany w `server/data/*.json`.
- Zalecenie: prosty write-lock (`isSaving`) z kolejka zapisow, aby unikac race condition.

## 6) Status implementacji (stan biezacy)

- Frontend (`client/`) utworzony przez Vite (React + TypeScript).
- Frontend ma juz pierwszy ekran systemowy: Dashboard (bez landing page).
- Dashboard zostal podzielony na mniejsze komponenty i dostal lewy sidebar nawigacyjny.
- Frontend posiada wspolny layout aplikacji i dzialajacy sidebar miedzy podstronami (`Dashboard`, `Czytelnicy`, `Katalog`, `Wypozyczenia`).
- Dodano responsywny tryb mobilny sidebara (przycisk `Menu` + panel wysuwany + backdrop).
- Backend (`server/`) utworzony jako Node.js + Express + TypeScript.
- Wspolne modele domenowe znajduja sie w `shared/src/models.ts`.
- Silnik in-memory (`DatabaseService`) jest podlaczony do API i persystencji JSON.
- Dodane endpointy:
  - `GET/POST /api/books`
  - `GET/POST/DELETE /api/readers`
  - `GET /api/loans`, `POST /api/loans/borrow`, `POST /api/loans/return`
  - `GET /api/reports/overview`, `GET /api/reports/overdue`

## 7) Uruchamianie projektu

1. Backend:
   - `cd server`
   - `npm install`
   - `npm run dev`
2. Frontend:
   - `cd client`
   - `npm install`
   - `npm run dev`

Domyslne porty:
- Backend: `http://localhost:4000`
- Frontend: `http://localhost:5173`

## 8) Dziennik zmian

### 2026-04-12
- Wdrożono "Intelektualną Wyszukiwarkę Prefixową" w `AVLTree` (metoda `searchPrefix`) dla wyszukiwania po fragmencie tytułu w O(log N).
- Dodano wyszukiwanie po autorze i kategorii z pomocą `.includes()` na Mapach pomocniczych (obsługa podciągów).
- Dodano wyszukiwanie po ISBN (prefixowe, case-insensitive) zarówno w backendzie jak i UI.
- Skonfigurowano proxy w `vite.config.ts` (przekierowanie `/api` → `localhost:4000`).
- Zbudowano stronę Katalogu (`CatalogPage`) z dynamicznym filtrowaniem po tytule, autorze, ISBN i kategorii.
- Kategorie w dropdownie są teraz pobierane dynamicznie z API (zamiast hardkodowanych wartości).
- Dodano endpoint `PUT /api/books/:id` umożliwiający edycję istniejącej książki.
- Wdrożono metodę `updateBook()` w `DatabaseService` – poprawnie usuwa stare indeksy z drzewa AVL i Map, a następnie rejestruje zaktualizowane klucze.
- Dodano modal `BookFormModal` pozwalający na **dodawanie** nowych tytułów oraz **edycję** istniejących (tytuł, autor, kategorie, ISBN, rok, liczba egzemplarzy).
- Przycisk ✏️ na karcie książki (`BookCard`) otwiera formularz edycji z wstępnie wypełnionymi polami.
- Dodano endpoint `DELETE /api/books/:id` z blokadą usunięcia gdy istnieją aktywne/przeterminowane wypożyczenia.
- Wdrożono metodę `removeBook()` w `DatabaseService` – czyści wszystkie indeksy (AVL + Map) przy usuwaniu.
- Przycisk 🗑️ na karcie otwiera okienko potwierdzenia; błąd z API wyświetlany jest inline bez zamykania dialogu.
- Dropdown kategorii pobiera unikalne wartości dynamicznie z API (odświeżany po każdej operacji CRUD).

### 2026-03-30
- Dodano wspolny layout frontendu, wykorzystywany na kazdej podstronie.
- Sidebar stal sie dzialajaca nawigacja miedzy widokami: `Dashboard`, `Czytelnicy`, `Katalog`, `Wypozyczenia`.
- Dodano lekkie widoki MVP dla podstron `Czytelnicy`, `Katalog`, `Wypozyczenia`.
- Dodano UX mobilny sidebara: przycisk otwarcia menu, wysuwany panel i zamykanie przez klik w backdrop lub klawisz `Escape`.
- Wdrozono redesign "Command Center": pelna kolumna sidebara bez efektu lewitowania i lepsze wykorzystanie szerokosci ekranu.
- Dodano breadcrumbs i pasek kontekstowy (sekcja, opis, szybkie akcje) dla wygodniejszej nawigacji.
- Odswiezono palete i komponenty UI na bardziej nowoczesny, profesjonalny styl z zachowaniem responsywnosci.
- Poprawiono mobilny layout: usunieto nadmiarowa pusta przestrzen u gory ekranu.
- Przeprojektowano top bar na czysty panel (bez ucietego border-fade), aby wygladal bardziej premium i spojnie.
- Dodano tokeny typografii i ujednolicono skale tekstu dla lepszej spojnosci interfejsu.
- Dodano "focused content width" w obszarze roboczym dla bardziej ergonomicznego czytania tresci na szerokich ekranach.
- Dodano nowoczesny panel "Szybkie akcje" (sheet) z mikrointerakcjami i responsywnym zachowaniem.
- Dodano stany puste (empty states) dla paneli alertow i aktywnosci, aby interfejs byl czytelny takze bez danych.
- Dodano przełącznik "Tryb skupienia" poprawiajacy czytelnosc tabel i list na desktopie.
- Rozszerzono mikrointerakcje premium: hover/press/focus-visible dla kart, paneli, tabel i przyciskow.
- Dodano system ikon Lucide w sidebarze oraz akcjach, aby interfejs byl bardziej czytelny i nowoczesny.
- Dodano skeleton loading podczas zmiany sekcji oraz placeholdery dla kart, list i tabel.
- Ujednolicono motion design przez wspolne tokeny animacji i dodano wsparcie `prefers-reduced-motion`.

### 2026-03-23
- Dodano monorepo z katalogami `client`, `server`, `shared`.
- Wygenerowano frontend Vite React+TS.
- Podmieniono starter Vite na makiete Dashboardu biblioteki (statystyki, alerty, aktywnosc).
- Dodano modul dashboardu z mock danymi i osobnym stylem.
- Dodano lewy sidebar nawigacyjny (`Dashboard`, `Czytelnicy`, `Katalog`, `Wypozyczenia`).
- Rozbito ekran Dashboard na komponenty: naglowek, siatka KPI, panel alertow, panel aktywnosci.
- Skonfigurowano backend Express+TS (`tsconfig`, skrypty npm, app/server bootstrap).
- Dodano kontrolery i routing API dla ksiazek, czytelnikow, wypozyczen i raportow.
- Dodano puste snapshoty danych `server/data/*.json`.
- Zweryfikowano build:
  - `server`: `npm run typecheck` oraz `npm run build`.
  - `client`: `npm run build`.
