"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBook = exports.listBooks = void 0;
const node_crypto_1 = require("node:crypto");
const DatabaseService_1 = require("../../db/DatabaseService");
const db = DatabaseService_1.DatabaseService.getInstance();
const listBooks = (req, res) => {
    const { title } = req.query;
    if (typeof title === "string" && title.trim() !== "") {
        const bookIds = db.booksByTitle.search(title);
        const books = Array.from(bookIds).map(id => db.getBook(id)).filter(Boolean);
        res.status(200).json(books);
        return;
    }
    res.status(200).json(db.listBooks());
};
exports.listBooks = listBooks;
const createBook = async (req, res) => {
    try {
        const now = new Date().toISOString();
        const payload = {
            id: req.body.id ?? (0, node_crypto_1.randomUUID)(),
            isbn: String(req.body.isbn),
            title: String(req.body.title),
            authors: Array.isArray(req.body.authors) ? req.body.authors : [],
            categories: Array.isArray(req.body.categories) ? req.body.categories : [],
            publishedYear: Number(req.body.publishedYear ?? new Date().getFullYear()),
            totalCopies: Number(req.body.totalCopies ?? 1),
            availableCopies: Number(req.body.availableCopies ?? req.body.totalCopies ?? 1),
            createdAt: now,
            updatedAt: now,
        };
        const created = db.addBook(payload);
        await db.saveAll();
        res.status(201).json(created);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.createBook = createBook;
