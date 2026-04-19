import { LoaderCircle, PencilLine, Search, Trash2, UserPlus, UsersRound } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { SmartPagination } from "../../components/pagination/SmartPagination";
import { getTotalPages, paginateItems } from "../../components/pagination/paginationUtils";
import "./readers.css";

type ReaderStatus = "ACTIVE" | "SUSPENDED";

type ReaderDto = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: ReaderStatus;
  createdAt: string;
};

type CreateReaderForm = {
  firstName: string;
  lastName: string;
  email: string;
  status: ReaderStatus;
};

type ReadersPageProps = {
  isLoading?: boolean;
  pendingAction?: string | null;
  onPendingActionConsumed?: () => void;
};

export function ReadersPage({ isLoading = false, pendingAction, onPendingActionConsumed }: ReadersPageProps) {
  const [readers, setReaders] = useState<ReaderDto[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ReaderStatus>("ALL");
  const [createForm, setCreateForm] = useState<CreateReaderForm>({
    firstName: "",
    lastName: "",
    email: "",
    status: "ACTIVE",
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingReaderId, setEditingReaderId] = useState<string | null>(null);
  const [readerPendingDelete, setReaderPendingDelete] = useState<string | null>(null);
  const [rowErrorByReader, setRowErrorByReader] = useState<Record<string, string>>({});
  const [deletingReaderId, setDeletingReaderId] = useState<string | null>(null);
  const [togglingReaderId, setTogglingReaderId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const applyReadersSort = (list: ReaderDto[]) =>
    [...list].sort((a, b) => a.lastName.localeCompare(b.lastName, "pl"));

  const parseErrorMessage = async (response: Response, fallback: string): Promise<string> => {
    try {
      const payload = (await response.json()) as { error?: string };
      return payload.error ?? fallback;
    } catch {
      return fallback;
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadReaders = async () => {
      setApiLoading(true);
      setApiError(null);

      try {
        const response = await fetch("/api/readers", { signal: controller.signal });

        if (!response.ok) {
          throw new Error("Nie udalo sie pobrac listy czytelnikow.");
        }

        const payload = (await response.json()) as ReaderDto[];
        setReaders(applyReadersSort(payload));
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        setApiError("Brak polaczenia z API czytelnikow. Sprawdz backend i odswiez widok.");
      } finally {
        setApiLoading(false);
      }
    };

    loadReaders();

    return () => {
      controller.abort();
    };
  }, []);

  const filteredReaders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return readers
      .filter((reader) => (statusFilter === "ALL" ? true : reader.status === statusFilter))
      .filter((reader) => {
        if (!normalizedQuery) {
          return true;
        }

        const fullName = `${reader.firstName} ${reader.lastName}`.toLowerCase();
        return fullName.includes(normalizedQuery) || reader.email.toLowerCase().includes(normalizedQuery);
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName, "pl"));
  }, [query, readers, statusFilter]);

  const totalPages = useMemo(() => getTotalPages(filteredReaders.length, pageSize), [filteredReaders.length, pageSize]);
  const pagedReaders = useMemo(() => paginateItems(filteredReaders, page, pageSize), [filteredReaders, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // Quick action: scroll to and focus the reader create form
  useEffect(() => {
    if (pendingAction === 'add-reader') {
      onPendingActionConsumed?.();
      setTimeout(() => {
        const form = document.querySelector<HTMLElement>('.reader-create');
        const input = form?.querySelector<HTMLInputElement>('input');
        form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        input?.focus();
      }, 100);
    }
  }, [pendingAction]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateInput = (field: keyof CreateReaderForm, value: string) => {
    setCreateError(null);
    setCreateForm((current) => ({ ...current, [field]: value }));
  };

  const resetFormToCreateMode = () => {
    setEditingReaderId(null);
    setCreateError(null);
    setCreateForm({
      firstName: "",
      lastName: "",
      email: "",
      status: "ACTIVE",
    });
  };

  const handleCreateOrUpdateReader = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);

    const firstName = createForm.firstName.trim();
    const lastName = createForm.lastName.trim();
    const email = createForm.email.trim().toLowerCase();

    if (!firstName || !lastName || !email) {
      setCreateError("Uzupelnij imie, nazwisko i email.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setCreateError("Podaj poprawny adres email.");
      return;
    }

    if (
      readers.some(
        (reader) => reader.email.toLowerCase() === email && (editingReaderId ? reader.id !== editingReaderId : true),
      )
    ) {
      setCreateError("Czytelnik o takim emailu juz istnieje.");
      return;
    }

    setIsCreating(true);

    try {
      const isEditMode = Boolean(editingReaderId);
      const response = await fetch(isEditMode ? `/api/readers/${editingReaderId}` : "/api/readers", {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          status: createForm.status,
        }),
      });

      if (!response.ok) {
        const message = await parseErrorMessage(
          response,
          isEditMode ? "Nie udalo sie zaktualizowac czytelnika." : "Nie udalo sie dodac czytelnika.",
        );
        throw new Error(message);
      }

      const saved = (await response.json()) as ReaderDto;
      setReaders((current) => {
        if (isEditMode) {
          return applyReadersSort(current.map((reader) => (reader.id === saved.id ? saved : reader)));
        }

        return applyReadersSort([...current, saved]);
      });
      resetFormToCreateMode();
    } catch (error) {
      setCreateError((error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const openEditMode = (reader: ReaderDto) => {
    setCreateError(null);
    setEditingReaderId(reader.id);
    setCreateForm({
      firstName: reader.firstName,
      lastName: reader.lastName,
      email: reader.email,
      status: reader.status,
    });
  };

  const handleDeleteReader = async (readerId: string) => {
    setDeletingReaderId(readerId);
    setRowErrorByReader((current) => ({ ...current, [readerId]: "" }));

    try {
      const response = await fetch(`/api/readers/${readerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await parseErrorMessage(response, "Nie udalo sie usunac czytelnika.");
        throw new Error(message);
      }

      setReaders((current) => current.filter((reader) => reader.id !== readerId));
      setReaderPendingDelete(null);
    } catch (error) {
      setRowErrorByReader((current) => ({
        ...current,
        [readerId]: (error as Error).message,
      }));
    } finally {
      setDeletingReaderId(null);
    }
  };

  const handleQuickToggleStatus = async (reader: ReaderDto) => {
    const nextStatus: ReaderStatus = reader.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setTogglingReaderId(reader.id);
    setRowErrorByReader((current) => ({ ...current, [reader.id]: "" }));

    try {
      const response = await fetch(`/api/readers/${reader.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: reader.firstName,
          lastName: reader.lastName,
          email: reader.email,
          status: nextStatus,
        }),
      });

      if (!response.ok) {
        const message = await parseErrorMessage(response, "Nie udalo sie zmienic statusu czytelnika.");
        throw new Error(message);
      }

      const updated = (await response.json()) as ReaderDto;
      setReaders((current) => applyReadersSort(current.map((item) => (item.id === updated.id ? updated : item))));

      if (editingReaderId === updated.id) {
        setCreateForm((current) => ({ ...current, status: updated.status }));
      }
    } catch (error) {
      setRowErrorByReader((current) => ({
        ...current,
        [reader.id]: (error as Error).message,
      }));
    } finally {
      setTogglingReaderId(null);
    }
  };

  const activeCount = readers.filter((reader) => reader.status === "ACTIVE").length;
  const suspendedCount = readers.filter((reader) => reader.status === "SUSPENDED").length;
  const panelLoading = isLoading || apiLoading;

  if (panelLoading) {
    return (
      <section className="module-page" aria-busy="true">
        <article className="module-card">
          <div className="skeleton skeleton-line skeleton-heading" />
          <div className="skeleton skeleton-line skeleton-paragraph" />
          <div className="skeleton skeleton-line skeleton-paragraph" />
          <div className="skeleton skeleton-line skeleton-paragraph" />
        </article>
      </section>
    );
  }

  const isInitialEmpty = readers.length === 0;
  const isFilteredEmpty = !isInitialEmpty && filteredReaders.length === 0;

  return (
    <section className="module-page" aria-labelledby="readers-title">
      <header className="module-page-head">
        <p className="module-kicker">Czytelnicy</p>
        <h1 id="readers-title">Zarzadzanie czytelnikami</h1>
        <p>Lista kont czytelnikow z filtrowaniem statusu i szybkim wyszukiwaniem po nazwisku oraz emailu.</p>
      </header>

      <section className="readers-overview" aria-label="Podsumowanie czytelnikow">
        <article className="reader-kpi">
          <p>Wszyscy</p>
          <strong>{readers.length}</strong>
        </article>
        <article className="reader-kpi is-good">
          <p>Aktywni</p>
          <strong>{activeCount}</strong>
        </article>
        <article className="reader-kpi is-warning">
          <p>Zawieszeni</p>
          <strong>{suspendedCount}</strong>
        </article>
      </section>

      <article className="module-card">
        <form className="reader-create" onSubmit={handleCreateOrUpdateReader}>
          <h2>{editingReaderId ? "Edytuj czytelnika" : "Dodaj czytelnika"}</h2>

          <div className="reader-create-grid">
            <label>
              Imie
              <input
                className="ui-input"
                value={createForm.firstName}
                onChange={(event) => handleCreateInput("firstName", event.target.value)}
                placeholder="np. Jan"
              />
            </label>

            <label>
              Nazwisko
              <input
                className="ui-input"
                value={createForm.lastName}
                onChange={(event) => handleCreateInput("lastName", event.target.value)}
                placeholder="np. Kowalski"
              />
            </label>

            <label>
              Email
              <input
                className="ui-input"
                value={createForm.email}
                onChange={(event) => handleCreateInput("email", event.target.value)}
                placeholder="np. jan@biblioteka.pl"
              />
            </label>

            <label>
              Status
              <select
                className="ui-select"
                value={createForm.status}
                onChange={(event) => handleCreateInput("status", event.target.value as ReaderStatus)}
              >
                <option value="ACTIVE">Aktywny</option>
                <option value="SUSPENDED">Zawieszony</option>
              </select>
            </label>
          </div>

          <div className="reader-create-actions">
            {createError ? <p className="reader-inline-error">{createError}</p> : null}
            <div className="reader-create-buttons">
              {editingReaderId ? (
                <button type="button" onClick={resetFormToCreateMode} disabled={isCreating}>
                  Anuluj
                </button>
              ) : null}
              <button type="submit" className="ui-btn ui-btn--primary" disabled={isCreating}>
                {isCreating ? <LoaderCircle size={15} className="spin" /> : editingReaderId ? <PencilLine size={15} /> : <UserPlus size={15} />}
                {editingReaderId ? "Zapisz zmiany" : "Dodaj"}
              </button>
            </div>
          </div>
        </form>

        <div className="readers-toolbar">
          <label className="readers-search" htmlFor="readers-query">
            <Search size={16} strokeWidth={2.1} aria-hidden="true" />
            <input
              id="readers-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Szukaj po nazwisku lub emailu"
            />
          </label>

          <div className="readers-filters" role="group" aria-label="Filtr statusu konta">
            <button
              type="button"
              className={`ui-btn ui-btn--pill ${statusFilter === "ALL" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("ALL")}
            >
              Wszyscy
            </button>
            <button
              type="button"
              className={`ui-btn ui-btn--pill ${statusFilter === "ACTIVE" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("ACTIVE")}
            >
              Aktywni
            </button>
            <button
              type="button"
              className={`ui-btn ui-btn--pill ${statusFilter === "SUSPENDED" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("SUSPENDED")}
            >
              Zawieszeni
            </button>
          </div>
        </div>

        <div className="module-state-row" role="status" aria-live="polite">
          <p>
            {statusFilter === "ALL" && !query
              ? `Liczba kont: ${filteredReaders.length}`
              : `Dopasowane konta: ${filteredReaders.length}`}
          </p>
          {(statusFilter !== "ALL" || query) ? (
            <button
              type="button"
              className="ui-btn ui-btn--compact ui-btn--ghost"
              onClick={() => {
                setStatusFilter("ALL");
                setQuery("");
              }}
            >
              Reset filtrow
            </button>
          ) : null}
        </div>

        {apiError ? <p className="dash-warning">{apiError}</p> : null}

        {isInitialEmpty ? (
          <div className="empty-state" role="status" aria-live="polite">
            <span className="empty-state-icon" aria-hidden="true">
              <UsersRound size={17} strokeWidth={2.1} />
            </span>
            <h3>Brak czytelnikow</h3>
            <p>Nie ma jeszcze zadnych kart czytelnika. Dodaj pierwsza osobe, aby rozpoczac prace.</p>
          </div>
        ) : null}

        {isFilteredEmpty ? (
          <div className="empty-state" role="status" aria-live="polite">
            <span className="empty-state-icon" aria-hidden="true">
              <Search size={17} strokeWidth={2.1} />
            </span>
            <h3>Brak wynikow filtrowania</h3>
            <p>Zmien filtr statusu lub fraze wyszukiwania, aby zobaczyc dopasowane konta.</p>
          </div>
        ) : null}

        {!isInitialEmpty && !isFilteredEmpty ? (
          <ul className="readers-list" aria-label="Lista czytelnikow">
            {pagedReaders.map((reader) => (
              <li key={reader.id} className="reader-card">
                <div>
                  <p className="reader-name">{reader.firstName} {reader.lastName}</p>
                  <p className="reader-email">{reader.email}</p>
                  {rowErrorByReader[reader.id] ? (
                    <p className="reader-inline-error">{rowErrorByReader[reader.id]}</p>
                  ) : null}
                </div>

                <div className="reader-meta">
                  <span className={`reader-status ${reader.status === "ACTIVE" ? "is-active" : "is-suspended"}`}>
                    {reader.status === "ACTIVE" ? "Aktywny" : "Zawieszony"}
                  </span>
                  <span className="reader-created">
                    Dodano: {new Date(reader.createdAt).toLocaleDateString("pl-PL")}
                  </span>
                  {readerPendingDelete === reader.id ? (
                    <div className="reader-delete-box">
                      <p>Usunac konto?</p>
                      <div>
                        <button
                          type="button"
                          className="ui-btn ui-btn--compact ui-btn--danger"
                          onClick={() => handleDeleteReader(reader.id)}
                          disabled={deletingReaderId === reader.id}
                        >
                          {deletingReaderId === reader.id ? <LoaderCircle size={14} className="spin" /> : null}
                          Potwierdz
                        </button>
                        <button
                          type="button"
                          className="ui-btn ui-btn--compact ui-btn--secondary"
                          onClick={() => setReaderPendingDelete(null)}
                          disabled={deletingReaderId === reader.id}
                        >
                          Anuluj
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="reader-actions-inline">
                      <button
                        type="button"
                        className="ui-btn ui-btn--compact ui-btn--secondary reader-status-toggle"
                        onClick={() => handleQuickToggleStatus(reader)}
                        disabled={togglingReaderId === reader.id}
                      >
                        {togglingReaderId === reader.id ? <LoaderCircle size={14} className="spin" /> : null}
                        {reader.status === "ACTIVE" ? "Zawies" : "Aktywuj"}
                      </button>
                      <button type="button" className="ui-btn ui-btn--compact ui-btn--secondary reader-edit-trigger" onClick={() => openEditMode(reader)}>
                        <PencilLine size={14} /> Edytuj
                      </button>
                      <button
                        type="button"
                        className="ui-btn ui-btn--compact ui-btn--danger reader-delete-trigger"
                        onClick={() => setReaderPendingDelete(reader.id)}
                      >
                        <Trash2 size={14} /> Usun
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {!isInitialEmpty && !isFilteredEmpty ? (
          <SmartPagination
            label="Czytelnicy"
            totalItems={filteredReaders.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(next) => {
              setPageSize(next);
              setPage(1);
            }}
            pageSizeOptions={[8, 12, 20]}
          />
        ) : null}
      </article>
    </section>
  );
}
