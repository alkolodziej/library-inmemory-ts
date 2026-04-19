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
  - `GET/POST /api/books`, `PUT /api/books/:id`, `DELETE /api/books/:id`
  - `GET/POST/PUT/DELETE /api/readers`
  - `GET /api/loans`, `POST /api/loans/borrow`, `POST /api/loans/return`, `POST /api/loans/extend`
  - `GET /api/reports/overview`, `GET /api/reports/overdue`
- Modul Wypozyczenia w pelni funkcjonalny: nowe wypozyczenie, zwrot, przedluzenie, alerty przetrzyman.
- Zaimplementowane struktury danych: `AVLTree` (po `title`, `dueDate`), `HashMap` (po ID), indeksy pomocnicze (`Map<string, Set<string>>`).
- Wdrozono symulacje platnosci (`FeeModal`) przy zwrocie po terminie i przedluzeniu przeterminowanych wypozyczen.
- Autocomplete (typeahead) przy nowym wypozyczeniu — wyszukiwanie czytelnika i ksiazki z informacja o dostepnosci.
- Sortowalne kolumny i paginacja (`SmartPagination`) w module Wypozyczenia i Katalogu.
- Blokada/zawieszenie czytelnika (`SuspendReaderModal`) bezposrednio z poziomu wiersza przeterminowanego wypozyczenia.

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

### 2026-04-19
- Zaimplementowano modul Wypozyczen — pelna obsluga wypozyczen i zwrotow podlaczona do backendu (`AVLTree` po `dueDate`, `HashMap` po `loanId`, indeks po `readerId`/`bookId`).
- Wdrozono endpoint `POST /api/loans/extend` z poprawna aktualizacja drzewa `AVLTree` (usuwanie starego klucza, wstawianie nowego).
- Sekcja alertow "Przekroczone terminy" wyswietla Top 3 najdluzej przetrzymanych posortowanych malejaco wg liczby dni; reszte wskazuje filtr "Po terminie" w tabeli.
- Dodano symulacje platnosci (`FeeModal`): kara 0.50 PLN/dzien za zwrot po terminie, oplata 5 PLN za przedluzenie przeterminowanego wypozyczenia, bezplatne przedluzenie aktywnego.
- Dla zwrotu wypozyczenia aktywnego (w terminie) wprowadzono prosty modal potwierdzenia (`ConfirmReturnModal`) bez naliczania oplat.
- Zastapiono listy rozwijane `<select>` autouzupelnianiem (typeahead) przy nowym wypozyczeniu — czytelnik i ksiazka wyszukiwane z podpowiedziami; przy ksiazkach widoczna informacja o dostepnosci egzemplarzy.
- Zmieniono `ReturnModal` na picker wyszukiwarkowy; rodzic (`LoansPage`) decyduje o pokazaniu `FeeModal` lub `ConfirmReturnModal`.
- Dodano przycisk zawieszenia czytelnika (`SuspendReaderModal`) bezposrednio z wiersza przeterminowanego wypozyczenia w Top 3 i w tabeli — wywoluje `PUT /api/readers/:id` z `status: SUSPENDED`.
- Dodano badge "zawieszone" przy nazwisku czytelnika w tabeli wypozyczen po zawieszeniu konta.
- Naprawiono zawijanie przyciskow akcji (Edytuj/Usun) w Katalogu i tabeli Wypozyczen — `flex-wrap: nowrap` + `min-width` na kolumnie Akcje.
- Tabela Wypozyczen: sortowalne kolumny (Czytelnik, Tytul, Wypozyczono, Termin, Zwrocono) z ikonami ↑↓↕; klikniecie zakladki "Po terminie" auto-sortuje po `dueAt` rosnaco (najdluzej przetrzymane na gorze).
- Badge statusu "Po terminie" wyswietla liczbe dni w nawiasie, np. `• Po terminie (+349 dni)`.
- Dodano paginacje `SmartPagination` w module Wypozyczen (domyslnie 15 rekordow/strone, opcje 10/15/25/50).
- Katalog: ksiazki sortowane alfabetycznie po tytule przed wyswietleniem; opcje paginacji zmienione na 9/12/15/18.
- Wygenerowano realistyczne dane testowe: 200+ ksiazek, 200+ czytelnikow, 200+ wypozyczen do testow wydajnosciowych struktury in-memory.
- Podpieto panel "Szybkie akcje" (dostepny z kazdego widoku przez prawy gorny przycisk): Nowe wypozyczenie → otwiera `BorrowFormModal` na `#loans`, Skanuj zwrot → otwiera `ReturnModal` na `#loans`, Dodaj czytelnika → nawiguje do `#readers` i scrolluje do formularza, Dodaj tytul → otwiera `BookFormModal` na `#catalog`; nawigacja i otwieranie modalu sa ze soba zsynchronizowane (delay 320 ms po zmianie trasy).
- Naprawiono blad w `updateReader()` (`DatabaseService`) — spread czesciowego obiektu updates z polami `undefined` nadpisywal istniejace dane czytelnika (np. imiê/nazwisko po zawieszeniu konta tylko ze statusem); dodano filtrowanie undefined przed spreaem (`safeUpdates`).
- Przywrocono dane czytelnika Adam Dabrowski uszkodzone przez wymieniiony blad (firstName/lastName w `readers.json`).
- Zawieszeni czytelnicy sa teraz widoczni na liscie autouzupelniania formularza nowego wypozyczenia z ikona 🔒 i etykieta "zawieszone" (styl analogiczny do niedostepnych ksiazek); klikniecie zawieszonego pokazuje blad inline i blokuje przycisk "Wypozycz".
- Zawieszeni czytelnicy po terminie moga zwrocic ksiazke i przedluzyc wypozyczenie przez `FeeModal` (ten sam przepływ co aktywni).
- Wdrozono automatyczne odblokowanie zawieszonego czytelnika: po zwrocie ostatniej **przeterminowanej** ksiazki system sprawdza czy czytelnik ma jeszcze inne wypozyczenia **po terminie**; jesli nie (moga pozostac wypozyczenia w terminie) — wywoluje `PUT /api/readers/:id` z `status: ACTIVE` i wyswietla zielony banner z imieniem czytelnika.
- Przycisk 🔒 i badge "zawieszone" ustawione po prawej stronie komorki "Czytelnik" (`justify-content: space-between`); nazwa czytelnika pozostaje po lewej.
- Dodano wyszukiwarke w module Wypozyczen: pole tekstowe pod przyciskami filtra statusu filtruje tabele jednoczesnie po imieniu, nazwisku i tytule ksiazki; licznik wynikow aktualizuje sie na zywo; przycisk × czyci zapytanie.
- Naprawiono brakujacy `searchQuery` w tablicy zaleznosci `useMemo` (wyszukiwarka nie reagowala na wpisywanie).
- Naprawiono logike przedluzenia wypozyczenia po terminie (`extendLoan` w `DatabaseService`): nowy termin liczony jest od **dzisiaj + N dni** zamiast od przeterminowanej daty; dzieki temu po zaplaceniu kary wypozyczenie jest faktycznie aktywne i nie nalicza opłat ponownie.

### 2026-04-13
- Rozpoczeto realizacje zakresu Osoby 1 od sprintu "Dashboard live" (kolejnosc: 2 -> 1 -> 3).
- Dashboard frontend podlaczono do API: `GET /api/reports/overview`, `GET /api/reports/overdue`, `GET /api/readers`, `GET /api/books`.
- KPI na dashboardzie sa teraz wyliczane z danych backendowych (aktywne wypozyczenia, przetrzymania, nowi czytelnicy od poczatku tygodnia, dostepne egzemplarze).
- Panel alertow przetrzyman korzysta z danych backendowych i mapuje identyfikatory na czytelne nazwy czytelnikow i ksiazek.
- Panel aktywnosci dashboardu wykorzystuje dane o przetrzymaniach jako feed operacyjny.
- Dodano obsluge `loading/empty/error` dla raportow live z bezpiecznym fallbackiem na ostatnio dostepne dane.
- Zrealizowano sprint "Czytelnicy v1": widok podlaczony do `GET /api/readers`.
- Dodano wyszukiwarke czytelnikow (nazwisko/email) oraz filtry statusu: `Wszyscy`, `Aktywni`, `Zawieszeni`.
- Dodano panel podsumowania (liczba kont, aktywni, zawieszeni) i responsywny widok listy czytelnikow.
- Dodano stany `loading/empty/error` dla modulu Czytelnicy z komunikatami UX.
- Zrealizowano sprint "Czytelnicy v1.5": formularz dodawania czytelnika (`POST /api/readers`) z walidacja danych i komunikatami inline.
- Dodano usuwanie czytelnika (`DELETE /api/readers/:id`) z potwierdzeniem akcji i obsluga bledow biznesowych bez zamykania widoku.
- Dodano per-wiersz komunikaty bledow dla operacji usuwania (np. blokada usuniecia przy aktywnych/przeterminowanych wypozyczeniach).
- Dodano edycje czytelnika w UI (tryb "Edytuj" w formularzu) z zapisem zmian przez `PUT /api/readers/:id`.
- Rozszerzono backend o metode `updateReader()` z aktualizacja indeksow (`readersByEmail`, `readersByStatus`) i walidacja unikalnosci email.
- Dodano szybkie soft action w kartach czytelnikow: jednoczesne przelaczanie statusu `Aktywny/Zawieszony` jednym kliknieciem (`PUT /api/readers/:id`) z obsluga bledow inline.
- Uruchomiono Sprint A+B (UI audit + quick wins): poprawiono globalne osadzenie layoutu i zredukowano efekt "prawego marginesu".
- Ujednolicono szerokosc i centrowanie glownego obszaru tresci (topbar + content frame) dla lepszej spojnosci desktop.
- Dodano zabezpieczenie przed poziomym overflow (`overflow-x: clip`) oraz dopracowano paddings layoutu na mniejszych ekranach.
- Ujednolicono wysokosci i zachowanie przyciskow w module Czytelnicy oraz poprawiono responsywne zawijanie grup akcji.
- Dopracowano czytelnosc tabeli aktywnosci na mobile (lepsze paddings + plynne przewijanie).
- Zrealizowano Sprint C (responsywnosc production-grade): dopracowano breakpoints i zachowanie topbara/quick-sheet dla tablet/mobile.
- Dashboard dostal lepsze reguly adaptacyjne: inteligentne przelamanie siatki KPI i paneli, poprawiona czytelnosc alertow i tabel na waskich ekranach.
- Modul Czytelnicy zostal utwardzony pod mobile: stabilne ukladanie toolbara, formularza i przyciskow akcji bez nachodzenia elementow.
- Potwierdzono globalny zakres sprintow A-F dla calej aplikacji (Dashboard, Czytelnicy, Katalog, Wypozyczenia, layout wspolny).
- Rozpoczeto globalna unifikacje (Sprint D/E): usunieto inline style z modulu Katalog i przeniesiono je do wspolnych klas CSS.
- Ujednolicono przyciski, filtry, karty i modale Katalogu do tego samego systemu visual language co pozostale moduly.
- Zrealizowano Sprint D globalnie: dodano wspolny system kontrolek (`client/src/styles/ui.css`) dla przyciskow i pol formularzy.
- Podlaczono globalne klasy UI (`ui-btn`, `ui-input`, `ui-select`) w layoutcie, Czytelnikach, Katalogu i Wypozyczeniach.
- Usunieto duplikacje styli interakcyjnych i ujednolicono stany hover/active/focus/disabled w calej aplikacji.
- Zrealizowano Sprint E globalnie: dodano wspolny wzorzec stanu operacyjnego (`module-state-row`) z czytelnym komunikatem i szybkim CTA na ekranach Dashboard/Czytelnicy/Katalog/Wypozyczenia.
- Dashboard otrzymal live-status synchronizacji z przyciskiem `Odswiez`, co przyspiesza workflow bez zmiany sekcji.
- Katalog dostal usprawnienia produktywnosci: licznik wynikow, `Wyczysc filtry`, komunikat bledu API z akcja `Sprobuj ponownie`.
- Czytelnicy dostali licznik dopasowan i `Reset filtrow`, a przyciski potwierdzenia usuniecia zostaly dopiete do globalnego systemu UI.
- Wypozyczenia dostaly bardziej operacyjny układ MVP: strefe akcji, status gotowosci modulu i pusty stan przygotowany pod podpiecie API.
- Zrealizowano Sprint F globalnie: dopracowano motion polish i mikrointerakcje na poziomie calej aplikacji (layout + dashboard + katalog + shared controls).
- Dodano globalny stan przejscia sekcji (`isPageTransitioning`) dla płynniejszego i czytelniejszego przełączania widokow.
- Ujednolicono zachowanie hover pod urzadzenia wskaznikowe (`hover: hover` / `pointer: fine`), aby uniknac sztucznych efektow na ekranach dotykowych.
- Katalog otrzymal animacje wejscia dialogow i subtelny feedback kart/tagow z pelnym wsparciem `prefers-reduced-motion`.
- Kolejny sprint (plan): globalna obsluga duzych zbiorow danych - decyzja `paginacja` vs `infinite loading` per moduł oraz standard zwięzłego prezentowania duzych list/tabel.
- Zrealizowano kolejny sprint globalnie: wdrozono klasyczna, nowoczesna paginacje oparta o wspolny komponent `SmartPagination`.
- Paginacja zostala podlaczona do kluczowych widokow z duza iloscia danych: `Czytelnicy`, `Katalog` oraz panele `Alerty` i `Aktywnosc` na dashboardzie.
- Dodano UX premium paginacji: licznik zakresu (`od-do z calosci`), pasek postepu, nawigacje stron z elipsami oraz wybor rozmiaru strony.
- Zachowano pelna responsywnosc i globalna spojność wizualna (mobile-first, wspolne klasy UI, wsparcie reduced-motion).

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
