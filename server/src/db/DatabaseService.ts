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

  // Linked list for reader registration order (pagination/reporting)
  private readonly readerOrder = new DoublyLinkedList<string>();

  private isSaving = false;

  private constructor(dataDir?: string) {
    this.dataDir = dataDir ?? path.resolve(process.cwd(), "server/data");
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

  public addBook(input: Book): Book {
    if (this.booksById.has(input.id)) {
      throw new Error(`Book with id=${input.id} already exists.`);
    }

    if (input.availableCopies > input.totalCopies) {
      throw new Error("availableCopies cannot exceed totalCopies.");
    }

    this.booksById.set(input.id, input);
    this.addToMultiIndex(this.bookIdsByIsbn, input.isbn, input.id);

    return input;
  }

  public addReader(input: Reader): Reader {
    if (this.readersById.has(input.id)) {
      throw new Error(`Reader with id=${input.id} already exists.`);
    }

    this.readersById.set(input.id, input);
    this.readerOrder.push(input.id);

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

    book.availableCopies -= 1;
    this.booksById.set(book.id, book);

    return loan;
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

    for (const book of snapshot.books) {
      this.booksById.set(book.id, book);
      this.addToMultiIndex(this.bookIdsByIsbn, book.isbn, book.id);
    }

    for (const reader of snapshot.readers) {
      this.readersById.set(reader.id, reader);
      this.readerOrder.push(reader.id);
    }

    for (const loan of snapshot.loans) {
      this.loansById.set(loan.id, loan);
      this.addToMultiIndex(this.loanIdsByReaderId, loan.readerId, loan.id);
      this.addToMultiIndex(this.loanIdsByBookId, loan.bookId, loan.id);
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
    } catch {
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
}
