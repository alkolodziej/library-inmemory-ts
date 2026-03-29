"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReader = exports.createReader = exports.listReaders = void 0;
const node_crypto_1 = require("node:crypto");
const DatabaseService_1 = require("../../db/DatabaseService");
const db = DatabaseService_1.DatabaseService.getInstance();
const listReaders = (_req, res) => {
    res.status(200).json(db.listReaders());
};
exports.listReaders = listReaders;
const createReader = async (req, res) => {
    try {
        const now = new Date().toISOString();
        const payload = {
            id: req.body.id ?? (0, node_crypto_1.randomUUID)(),
            firstName: String(req.body.firstName),
            lastName: String(req.body.lastName),
            email: String(req.body.email),
            status: req.body.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
            createdAt: now,
            updatedAt: now,
        };
        const created = db.addReader(payload);
        await db.saveAll();
        res.status(201).json(created);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.createReader = createReader;
const deleteReader = async (req, res) => {
    try {
        db.removeReader(String(req.params.id));
        await db.saveAll();
        res.status(204).send();
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.deleteReader = deleteReader;
