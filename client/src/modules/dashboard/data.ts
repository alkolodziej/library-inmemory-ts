export type KpiCard = {
  label: string;
  value: string;
  trend: string;
  tone: "neutral" | "good" | "warning";
};

export type ActivityItem = {
  id: string;
  action: string;
  actor: string;
  time: string;
};

export type AlertItem = {
  id: string;
  reader: string;
  book: string;
  lateDays: number;
};

export const kpiCards: KpiCard[] = [
  {
    label: "Aktywne wypozyczenia",
    value: "126",
    trend: "+8 w tym tygodniu",
    tone: "good",
  },
  {
    label: "Dostepne egzemplarze",
    value: "842",
    trend: "7 tytulow ponizej progu",
    tone: "warning",
  },
  {
    label: "Nowi czytelnicy",
    value: "24",
    trend: "+3 od poniedzialku",
    tone: "good",
  },
  {
    label: "Przetrzymania",
    value: "11",
    trend: "Wymaga przypomnienia",
    tone: "warning",
  },
];

export const recentActivity: ActivityItem[] = [
  {
    id: "A1",
    action: "Zwrot ksiazki",
    actor: "Jan Kowalski",
    time: "10:12",
  },
  {
    id: "A2",
    action: "Nowe wypozyczenie",
    actor: "Anna Nowak",
    time: "09:58",
  },
  {
    id: "A3",
    action: "Dodano czytelnika",
    actor: "Bibliotekarz",
    time: "09:44",
  },
  {
    id: "A4",
    action: "Rezerwacja tytulu",
    actor: "Marek Zielinski",
    time: "09:21",
  },
];

export const overdueAlerts: AlertItem[] = [
  {
    id: "O1",
    reader: "Karolina Wisla",
    book: "Wiedzmin: Krew Elfow",
    lateDays: 5,
  },
  {
    id: "O2",
    reader: "Adam Czech",
    book: "Pan Tadeusz",
    lateDays: 3,
  },
  {
    id: "O3",
    reader: "Iga Lis",
    book: "Mistrz i Malgorzata",
    lateDays: 2,
  },
];
