"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = require("node:crypto");
const DoublyLinkedList_1 = require("./structures/DoublyLinkedList");
const AVLTree_1 = require("./structures/AVLTree");
const DEFAULT_SNAPSHOT = {
    books: [],
    readers: [],
    loans: [],
};
class DatabaseService {
    static instance = null;
    dataDir;
    // Primary stores (HashMap)
    booksById = new Map();
    readersById = new Map();
    loansById = new Map();
    // Secondary indexes
    bookIdsByIsbn = new Map();
    loanIdsByReaderId = new Map();
    loanIdsByBookId = new Map();
    readersByEmail = new Map();
    readersByStatus = new Map();
    booksByAuthor = new Map();
    booksByCategory = new Map();
    booksByTitle = new AVLTree_1.AVLTree((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    loansByDueDate = new AVLTree_1.AVLTree((a, b) => a.localeCompare(b));
    // Linked list for reader registration order (pagination/reporting)
    readerOrder = new DoublyLinkedList_1.DoublyLinkedList();
    isSaving = false;
    constructor(dataDir) {
        this.dataDir = dataDir ?? node_path_1.default.resolve(process.cwd(), "server/data");
    }
    static getInstance(dataDir) {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService(dataDir);
        }
        return DatabaseService.instance;
    }
    async loadAll() {
        await node_fs_1.promises.mkdir(this.dataDir, { recursive: true });
        const snapshot = await this.readSnapshot();
        this.hydrate(snapshot);
    }
    async saveAll() {
        if (this.isSaving) {
            return;
        }
        this.isSaving = true;
        try {
            const snapshot = this.createSnapshot();
            await this.writeSnapshotAtomically(snapshot);
        }
        finally {
            this.isSaving = false;
        }
    }
    listBooks() {
        return Array.from(this.booksById.values());
    }
    listReaders() {
        return Array.from(this.readersById.values());
    }
    listLoans() {
        return Array.from(this.loansById.values());
    }
    getBook(id) {
        return this.booksById.get(id);
    }
    getReader(id) {
        return this.readersById.get(id);
    }
    getLoan(id) {
        return this.loansById.get(id);
    }
    addBook(input) {
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
    addReader(input) {
        if (this.readersById.has(input.id)) {
            throw new Error(`Reader with id=${input.id} already exists.`);
        }
        this.readersById.set(input.id, input);
        this.readerOrder.push(input.id);
        this.addToMultiIndex(this.readersByEmail, input.email, input.id);
        this.addToMultiIndex(this.readersByStatus, input.status, input.id);
        return input;
    }
    removeReader(readerId) {
        const reader = this.readersById.get(readerId);
        if (!reader) {
            throw new Error(`Reader with id=${readerId} not found.`);
        }
        // Manual referential integrity: reader with active loan cannot be removed.
        const readerLoanIds = this.loanIdsByReaderId.get(readerId) ?? new Set();
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
    borrowBook(command) {
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
        const loan = {
            id: (0, node_crypto_1.randomUUID)(),
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
    returnBook(command) {
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
        const updatedLoan = {
            ...loan,
            status: "RETURNED",
            returnedAt: new Date().toISOString(),
        };
        this.loansById.set(loan.id, updatedLoan);
        this.loansByDueDate.remove(loan.dueAt, loan.id);
        return updatedLoan;
    }
    getOverviewStats() {
        let activeLoans = 0;
        let overdueLoans = 0;
        const now = Date.now();
        for (const loan of this.loansById.values()) {
            if (loan.status === "RETURNED") {
                continue;
            }
            if (new Date(loan.dueAt).getTime() < now) {
                overdueLoans += 1;
            }
            else {
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
    hydrate(snapshot) {
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
    createSnapshot() {
        return {
            books: Array.from(this.booksById.values()),
            readers: Array.from(this.readersById.values()),
            loans: Array.from(this.loansById.values()),
        };
    }
    async readSnapshot() {
        const books = await this.readJsonFile("books.json", []);
        const readers = await this.readJsonFile("readers.json", []);
        const loans = await this.readJsonFile("loans.json", []);
        return {
            ...DEFAULT_SNAPSHOT,
            books,
            readers,
            loans,
        };
    }
    async writeSnapshotAtomically(snapshot) {
        await Promise.all([
            this.writeJsonFileAtomic("books.json", snapshot.books),
            this.writeJsonFileAtomic("readers.json", snapshot.readers),
            this.writeJsonFileAtomic("loans.json", snapshot.loans),
        ]);
    }
    async readJsonFile(fileName, fallback) {
        const filePath = node_path_1.default.join(this.dataDir, fileName);
        try {
            const raw = await node_fs_1.promises.readFile(filePath, "utf8");
            return JSON.parse(raw);
        }
        catch {
            return fallback;
        }
    }
    async writeJsonFileAtomic(fileName, payload) {
        const filePath = node_path_1.default.join(this.dataDir, fileName);
        const tempPath = `${filePath}.tmp`;
        await node_fs_1.promises.writeFile(tempPath, JSON.stringify(payload, null, 2), "utf8");
        await node_fs_1.promises.rename(tempPath, filePath);
    }
    addToMultiIndex(index, key, value) {
        const existing = index.get(key) ?? new Set();
        existing.add(value);
        index.set(key, existing);
    }
    removeFromMultiIndex(index, key, value) {
        const existing = index.get(key);
        if (existing) {
            existing.delete(value);
            if (existing.size === 0) {
                index.delete(key);
            }
        }
    }
}
exports.DatabaseService = DatabaseService;
