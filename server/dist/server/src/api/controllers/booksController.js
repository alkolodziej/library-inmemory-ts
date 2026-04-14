"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBook = exports.updateBook = exports.createBook = exports.listBooks = void 0;
const node_crypto_1 = require("node:crypto");
const DatabaseService_1 = require("../../db/DatabaseService");
const db = DatabaseService_1.DatabaseService.getInstance();
const listBooks = (req, res) => {
    const { title, author, category, isbn } = req.query;
    let resultIds = null;
    if (typeof title === "string" && title.trim() !== "") {
        resultIds = db.booksByTitle.searchPrefix(title.trim());
    }
    if (typeof author === "string" && author.trim() !== "") {
        const authorIds = db.searchBooksByAuthorPrefix(author.trim());
        if (resultIds) {
            resultIds = new Set([...resultIds].filter(id => authorIds.has(id)));
        }
        else {
            resultIds = authorIds;
        }
    }
    if (typeof category === "string" && category.trim() !== "") {
        const categoryIds = db.searchBooksByCategoryPrefix(category.trim());
        if (resultIds) {
            resultIds = new Set([...resultIds].filter(id => categoryIds.has(id)));
        }
        else {
            resultIds = categoryIds;
        }
    }
    if (typeof isbn === "string" && isbn.trim() !== "") {
        const isbnIds = db.searchBooksByIsbnPrefix(isbn.trim());
        if (resultIds) {
            resultIds = new Set([...resultIds].filter(id => isbnIds.has(id)));
        }
        else {
            resultIds = isbnIds;
        }
    }
    if (resultIds !== null) {
        const books = Array.from(resultIds).map(id => db.getBook(id)).filter(Boolean);
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
            availableCopies: Number(req.body.totalCopies ?? 1),
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
const updateBook = async (req, res) => {
    try {
        const id = String(req.params.id);
        const body = req.body;
        // We expect authors and categories to be array of strings, or undefined
        const updates = { ...body };
        if (body.authors && Array.isArray(body.authors)) {
            updates.authors = body.authors;
        }
        if (body.categories && Array.isArray(body.categories)) {
            updates.categories = body.categories;
        }
        const updated = db.updateBook(id, updates);
        await db.saveAll();
        res.status(200).json(updated);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.updateBook = updateBook;
const deleteBook = async (req, res) => {
    try {
        db.removeBook(String(req.params.id));
        await db.saveAll();
        res.status(204).send();
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.deleteBook = deleteBook;
