import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  Book,
  BorrowBookCommand,
  DatabaseSnapshot,
  Loan,
  OverviewStats,
  Reader,
  ReturnBookCommand,
} from "../../../shared/src/models";
import { DoublyLinkedList } from "./structures/DoublyLinkedList";
import { AVLTree } from "./structures/AVLTree";

const DEFAULT_SNAPSHOT: DatabaseSnapshot = {
  books: [],
  readers: [],
  loans: [],
};

export class DatabaseService {
  private static instance: DatabaseService | null = null;

  private readonly dataDir: string;

  // Primary stores (HashMap)
  private readonly booksById = new Map<string, Book>();
  private readonly readersById = new Map<string, Reader>();
  private readonly loansById = new Map<string, Loan>();

  // Secondary indexes
  private readonly bookIdsByIsbn = new Map<string, Set<string>>();
  private readonly loanIdsByReaderId = new Map<string, Set<string>>();
  private readonly loanIdsByBookId = new Map<string, Set<string>>();

  private readonly readersByEmail = new Map<string, Set<string>>();
  private readonly readersByStatus = new Map<string, Set<string>>();
  private readonly booksByAuthor = new Map<string, Set<string>>();
  private readonly booksByCategory = new Map<string, Set<string>>();
  
  public readonly booksByTitle = new AVLTree<string, string>((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  public readonly loansByDueDate = new AVLTree<string, string>((a, b) => a.localeCompare(b));

  // Linked list for reader registration order (pagination/reporting)
  private readonly readerOrder = new DoublyLinkedList<string>();

  private isSaving = false;

  private constructor(dataDir?: string) {
    this.dataDir = dataDir ?? path.resolve(__dirname, "../../data");
  }

  public static getInstance(dataDir?: string): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService(dataDir);
    }

    return DatabaseService.instance;
  }

  public async loadAll(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });

    const snapshot = await this.readSnapshot();
    this.hydrate(snapshot);
  }

  public async saveAll(): Promise<void> {
    if (this.isSaving) {
      return;
    }

    this.isSaving = true;

    try {
      const snapshot = this.createSnapshot();
      await this.writeSnapshotAtomically(snapshot);
    } finally {
      this.isSaving = false;
    }
  }

  public listBooks(): Book[] {
    return Array.from(this.booksById.values());
  }

  public listReaders(): Reader[] {
    return Array.from(this.readersById.values());
  }

  public listLoans(): Loan[] {
    return Array.from(this.loansById.values());
  }

  public getBook(id: string): Book | undefined {
    return this.booksById.get(id);
  }

  public getReader(id: string): Reader | undefined {
    return this.readersById.get(id);
  }

  public getLoan(id: string): Loan | undefined {
    return this.loansById.get(id);
  }

  public searchBooksByAuthor(author: string): Set<string> {
    return this.booksByAuthor.get(author) ?? new Set<string>();
  }

  public searchBooksByAuthorPrefix(prefix: string): Set<string> {
    const result = new Set<string>();
    const lower = prefix.toLowerCase();
    for (const [author, ids] of this.booksByAuthor.entries()) {
      if (author.toLowerCase().includes(lower)) {
        for (const id of ids) result.add(id);
      }
    }
    return result;
  }

  public searchBooksByCategory(category: string): Set<string> {
    return this.booksByCategory.get(category) ?? new Set<string>();
  }

  public searchBooksByCategoryPrefix(prefix: string): Set<string> {
    const result = new Set<string>();
    const lower = prefix.toLowerCase();
    for (const [cat, ids] of this.booksByCategory.entries()) {
      if (cat.toLowerCase().includes(lower)) {
        for (const id of ids) result.add(id);
      }
    }
    return result;
  }

  public searchBooksByIsbnPrefix(prefix: string): Set<string> {
    const result = new Set<string>();
    const lower = prefix.toLowerCase();
    for (const [isbn, ids] of this.bookIdsByIsbn.entries()) {
      if (isbn.toLowerCase().includes(lower)) {
        for (const id of ids) result.add(id);
      }
    }
    return result;
  }

  public addBook(input: Book): Book {
    if (this.booksById.has(input.id)) {
      throw new Error(`Book with id=${input.id} already exists.`);
    }

    if (input.availableCopies > input.totalCopies) {
      throw new Error("availableCopies cannot exceed totalCopies.");
    }

    this.booksById.set(input.id, input);
    this.addToMultiIndex(this.bookIdsByIsbn, input.isbn, input.id);
    for (const author of input.authors) {
      this.addToMultiIndex(this.booksByAuthor, author, input.id);
    }
    for (const cat of input.categories) {
      this.addToMultiIndex(this.booksByCategory, cat, input.id);
    }
    this.booksByTitle.insert(input.title, input.id);

    return input;
  }

  public updateBook(id: string, updates: Partial<Book>): Book {
    const existing = this.booksById.get(id);
    if (!existing) {
      throw new Error(`Book with id=${id} not found.`);
    }

    // Remove old indexes
    this.removeFromMultiIndex(this.bookIdsByIsbn, existing.isbn, id);
    for (const author of existing.authors) {
      this.removeFromMultiIndex(this.booksByAuthor, author, id);
    }
    for (const cat of existing.categories) {
      this.removeFromMultiIndex(this.booksByCategory, cat, id);
    }
    this.booksByTitle.remove(existing.title, id);

    // Prepare updated book
    const updated: Book = { ...existing, ...updates, updatedAt: new Date().toISOString() };

    // If totalCopies changed, recalculate availableCopies based on active loans
    if (updates.totalCopies !== undefined && updates.totalCopies !== existing.totalCopies) {
      const loanIds = this.loanIdsByBookId.get(id) ?? new Set<string>();
      let activeLoansCount = 0;
      for (const loanId of loanIds) {
        const loan = this.loansById.get(loanId);
        if (loan && (loan.status === "ACTIVE" || loan.status === "OVERDUE")) {
          activeLoansCount += 1;
        }
      }
      updated.availableCopies = Math.max(0, updated.totalCopies - activeLoansCount);
    }

    if (updated.availableCopies > updated.totalCopies) {
      throw new Error("availableCopies cannot exceed totalCopies.");
    }

    // Set new indexes
    this.booksById.set(id, updated);
    this.addToMultiIndex(this.bookIdsByIsbn, updated.isbn, id);
    for (const author of updated.authors) {
      this.addToMultiIndex(this.booksByAuthor, author, id);
    }
    for (const cat of updated.categories) {
      this.addToMultiIndex(this.booksByCategory, cat, id);
    }
    this.booksByTitle.insert(updated.title, id);

    return updated;
  }

  public removeBook(id: string): void {
    const existing = this.booksById.get(id);
    if (!existing) {
      throw new Error(`Book with id=${id} not found.`);
    }

    // Block removal if any active / overdue loans exist for this book
    const loanIds = this.loanIdsByBookId.get(id) ?? new Set<string>();
    for (const loanId of loanIds) {
      const loan = this.loansById.get(loanId);
      if (loan && (loan.status === "ACTIVE" || loan.status === "OVERDUE")) {
        throw new Error("Nie można usunąć książki, która ma aktywne wypożyczenia.");
      }
    }

    // Remove from all indexes
    this.removeFromMultiIndex(this.bookIdsByIsbn, existing.isbn, id);
    for (const author of existing.authors) {
      this.removeFromMultiIndex(this.booksByAuthor, author, id);
    }
    for (const cat of existing.categories) {
      this.removeFromMultiIndex(this.booksByCategory, cat, id);
    }
    this.booksByTitle.remove(existing.title, id);
    this.booksById.delete(id);
  }

  public addReader(input: Reader): Reader {
    if (this.readersById.has(input.id)) {
      throw new Error(`Reader with id=${input.id} already exists.`);
    }

    if (this.readersByEmail.has(input.email)) {
      throw new Error(`Reader with email=${input.email} already exists.`);
    }

    this.readersById.set(input.id, input);
    this.readerOrder.push(input.id);
    this.addToMultiIndex(this.readersByEmail, input.email, input.id);
    this.addToMultiIndex(this.readersByStatus, input.status, input.id);

    return input;
  }

  public removeReader(readerId: string): void {
    const reader = this.readersById.get(readerId);
    if (!reader) {
      throw new Error(`Reader with id=${readerId} not found.`);
    }

    // Manual referential integrity: reader with active loan cannot be removed.
    const readerLoanIds = this.loanIdsByReaderId.get(readerId) ?? new Set<string>();
    for (const loanId of readerLoanIds) {
      const loan = this.loansById.get(loanId);
      if (loan?.status === "ACTIVE" || loan?.status === "OVERDUE") {
        throw new Error("Cannot remove reader with active or overdue loans.");
      }
    }

    this.readersById.delete(readerId);
    this.removeFromMultiIndex(this.readersByEmail, reader.email, readerId);
    this.removeFromMultiIndex(this.readersByStatus, reader.status, readerId);
  }

  public updateReader(id: string, updates: Partial<Reader>): Reader {
    const existing = this.readersById.get(id);
    if (!existing) {
      throw new Error(`Reader with id=${id} not found.`);
    }

    const nextEmail = String(updates.email ?? existing.email);
    const nextStatus = updates.status === "SUSPENDED" ? "SUSPENDED" : updates.status === "ACTIVE" ? "ACTIVE" : existing.status;

    const existingForEmail = this.readersByEmail.get(nextEmail);
    if (nextEmail !== existing.email && existingForEmail && existingForEmail.size > 0) {
      throw new Error(`Reader with email=${nextEmail} already exists.`);
    }

    this.removeFromMultiIndex(this.readersByEmail, existing.email, id);
    this.removeFromMultiIndex(this.readersByStatus, existing.status, id);

    // Strip undefined so partial updates (e.g. status-only) don't overwrite existing fields
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    ) as Partial<Reader>;

    const updated: Reader = {
      ...existing,
      ...safeUpdates,
      email: nextEmail,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };

    this.readersById.set(id, updated);
    this.addToMultiIndex(this.readersByEmail, updated.email, id);
    this.addToMultiIndex(this.readersByStatus, updated.status, id);

    return updated;
  }

  public borrowBook(command: BorrowBookCommand): Loan {
    const reader = this.readersById.get(command.readerId);
    if (!reader) {
      throw new Error(`Reader with id=${command.readerId} not found.`);
    }

    if (reader.status !== "ACTIVE") {
      throw new Error("Reader is not active.");
    }

    const book = this.booksById.get(command.bookId);
    if (!book) {
      throw new Error(`Book with id=${command.bookId} not found.`);
    }

    if (book.availableCopies <= 0) {
      throw new Error("No copies available.");
    }

    const now = new Date();
    const dueAt = new Date(now.getTime());
    dueAt.setDate(dueAt.getDate() + command.days);

    const loan: Loan = {
      id: randomUUID(),
      readerId: command.readerId,
      bookId: command.bookId,
      borrowedAt: now.toISOString(),
      dueAt: dueAt.toISOString(),
      status: "ACTIVE",
    };

    this.loansById.set(loan.id, loan);
    this.addToMultiIndex(this.loanIdsByReaderId, loan.readerId, loan.id);
    this.addToMultiIndex(this.loanIdsByBookId, loan.bookId, loan.id);
    this.loansByDueDate.insert(loan.dueAt, loan.id);

    book.availableCopies -= 1;
    this.booksById.set(book.id, book);

    return loan;
  }

  public extendLoan(loanId: string, days: number = 7): Loan {
    const loan = this.loansById.get(loanId);
    if (!loan) {
      throw new Error(`Loan with id=${loanId} not found.`);
    }

    if (loan.status === "RETURNED") {
      throw new Error("Nie można przedłużyć już zwróconego wypożyczenia.");
    }

    // Remove old dueAt key from AVL tree
    this.loansByDueDate.remove(loan.dueAt, loan.id);

    // For overdue loans start from today, not from the past due date
    // so the new deadline is always in the future after paying the fee
    const now = new Date();
    const currentDue = new Date(loan.dueAt);
    const base = currentDue < now ? now : currentDue;
    const newDue = new Date(base);
    newDue.setDate(newDue.getDate() + days);

    const extended: Loan = {
      ...loan,
      dueAt: newDue.toISOString(),
      status: "ACTIVE", // reset – nowy termin jest w przyszłości
    };

    this.loansById.set(loan.id, extended);
    this.loansByDueDate.insert(extended.dueAt, extended.id);

    return extended;
  }

  public returnBook(command: ReturnBookCommand): Loan {
    const loan = this.loansById.get(command.loanId);
    if (!loan) {
      throw new Error(`Loan with id=${command.loanId} not found.`);
    }

    if (loan.status === "RETURNED") {
      throw new Error("Loan already returned.");
    }

    const book = this.booksById.get(loan.bookId);
    if (!book) {
      throw new Error(`Book with id=${loan.bookId} not found.`);
    }

    book.availableCopies += 1;
    this.booksById.set(book.id, book);

    const updatedLoan: Loan = {
      ...loan,
      status: "RETURNED",
      returnedAt: new Date().toISOString(),
    };

    this.loansById.set(loan.id, updatedLoan);
    this.loansByDueDate.remove(loan.dueAt, loan.id);

    return updatedLoan;
  }

  public getOverviewStats(): OverviewStats {
    let activeLoans = 0;
    let overdueLoans = 0;

    const now = Date.now();
    for (const loan of this.loansById.values()) {
      if (loan.status === "RETURNED") {
        continue;
      }

      if (new Date(loan.dueAt).getTime() < now) {
        overdueLoans += 1;
      } else {
        activeLoans += 1;
      }
    }

    return {
      totalBooks: this.booksById.size,
      totalReaders: this.readersById.size,
      activeLoans,
      overdueLoans,
    };
  }

  private hydrate(snapshot: DatabaseSnapshot): void {
    this.booksById.clear();
    this.readersById.clear();
    this.loansById.clear();
    this.bookIdsByIsbn.clear();
    this.loanIdsByBookId.clear();
    this.loanIdsByReaderId.clear();
    this.readerOrder.clear();

    this.readersByEmail.clear();
    this.readersByStatus.clear();
    this.booksByAuthor.clear();
    this.booksByCategory.clear();
    this.booksByTitle.clear();
    this.loansByDueDate.clear();

    for (const book of snapshot.books) {
      this.booksById.set(book.id, book);
      this.addToMultiIndex(this.bookIdsByIsbn, book.isbn, book.id);
      for (const author of book.authors) {
        this.addToMultiIndex(this.booksByAuthor, author, book.id);
      }
      for (const cat of book.categories) {
        this.addToMultiIndex(this.booksByCategory, cat, book.id);
      }
      this.booksByTitle.insert(book.title, book.id);
    }

    for (const reader of snapshot.readers) {
      this.readersById.set(reader.id, reader);
      this.readerOrder.push(reader.id);
      this.addToMultiIndex(this.readersByEmail, reader.email, reader.id);
      this.addToMultiIndex(this.readersByStatus, reader.status, reader.id);
    }

    for (const loan of snapshot.loans) {
      this.loansById.set(loan.id, loan);
      this.addToMultiIndex(this.loanIdsByReaderId, loan.readerId, loan.id);
      this.addToMultiIndex(this.loanIdsByBookId, loan.bookId, loan.id);
      if (loan.status !== "RETURNED") {
        this.loansByDueDate.insert(loan.dueAt, loan.id);
      }
    }
  }

  private createSnapshot(): DatabaseSnapshot {
    return {
      books: Array.from(this.booksById.values()),
      readers: Array.from(this.readersById.values()),
      loans: Array.from(this.loansById.values()),
    };
  }

  private async readSnapshot(): Promise<DatabaseSnapshot> {
    const books = await this.readJsonFile<Book[]>("books.json", []);
    const readers = await this.readJsonFile<Reader[]>("readers.json", []);
    const loans = await this.readJsonFile<Loan[]>("loans.json", []);

    return {
      ...DEFAULT_SNAPSHOT,
      books,
      readers,
      loans,
    };
  }

  private async writeSnapshotAtomically(snapshot: DatabaseSnapshot): Promise<void> {
    await Promise.all([
      this.writeJsonFileAtomic("books.json", snapshot.books),
      this.writeJsonFileAtomic("readers.json", snapshot.readers),
      this.writeJsonFileAtomic("loans.json", snapshot.loans),
    ]);
  }

  private async readJsonFile<T>(fileName: string, fallback: T): Promise<T> {
    const filePath = path.join(this.dataDir, fileName);

    try {
      const raw = await fs.readFile(filePath, "utf8");
      return JSON.parse(raw) as T;
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error);
      return fallback;
    }
  }

  private async writeJsonFileAtomic<T>(fileName: string, payload: T): Promise<void> {
    const filePath = path.join(this.dataDir, fileName);
    const tempPath = `${filePath}.tmp`;

    await fs.writeFile(tempPath, JSON.stringify(payload, null, 2), "utf8");
    await fs.rename(tempPath, filePath);
  }

  private addToMultiIndex(index: Map<string, Set<string>>, key: string, value: string): void {
    const existing = index.get(key) ?? new Set<string>();
    existing.add(value);
    index.set(key, existing);
  }

  private removeFromMultiIndex(index: Map<string, Set<string>>, key: string, value: string): void {
    const existing = index.get(key);
    if (existing) {
      existing.delete(value);
      if (existing.size === 0) {
        index.delete(key);
      }
    }
  }
}
