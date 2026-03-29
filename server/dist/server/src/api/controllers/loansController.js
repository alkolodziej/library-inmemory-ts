"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnBook = exports.borrowBook = exports.listLoans = void 0;
const DatabaseService_1 = require("../../db/DatabaseService");
const db = DatabaseService_1.DatabaseService.getInstance();
const listLoans = (_req, res) => {
    res.status(200).json(db.listLoans());
};
exports.listLoans = listLoans;
const borrowBook = async (req, res) => {
    try {
        const loan = db.borrowBook({
            readerId: String(req.body.readerId),
            bookId: String(req.body.bookId),
            days: Number(req.body.days ?? 14),
        });
        await db.saveAll();
        res.status(201).json(loan);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.borrowBook = borrowBook;
const returnBook = async (req, res) => {
    try {
        const loan = db.returnBook({
            loanId: String(req.body.loanId),
        });
        await db.saveAll();
        res.status(200).json(loan);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.returnBook = returnBook;
