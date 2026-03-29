export type EntityId = string;

export type ReaderStatus = "ACTIVE" | "SUSPENDED";
export type LoanStatus = "ACTIVE" | "RETURNED" | "OVERDUE";

export interface Book {
  id: EntityId;
  isbn: string;
  title: string;
  authors: string[];
  categories: string[];
  publishedYear: number;
  totalCopies: number;
  availableCopies: number;
  createdAt: string;
  updatedAt: string;
}

export interface Reader {
  id: EntityId;
  firstName: string;
  lastName: string;
  email: string;
  status: ReaderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  id: EntityId;
  bookId: EntityId;
  readerId: EntityId;
  borrowedAt: string;
  dueAt: string;
  returnedAt?: string;
  status: LoanStatus;
}

export interface BorrowBookCommand {
  readerId: EntityId;
  bookId: EntityId;
  days: number;
}

export interface ReturnBookCommand {
  loanId: EntityId;
}

export interface OverviewStats {
  totalBooks: number;
  totalReaders: number;
  activeLoans: number;
  overdueLoans: number;
}

export interface DatabaseSnapshot {
  books: Book[];
  readers: Reader[];
  loans: Loan[];
}
