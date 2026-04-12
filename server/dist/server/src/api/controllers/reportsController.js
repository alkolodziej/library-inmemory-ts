"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOverdue = exports.getOverview = void 0;
const DatabaseService_1 = require("../../db/DatabaseService");
const db = DatabaseService_1.DatabaseService.getInstance();
const getOverview = (_req, res) => {
    res.status(200).json(db.getOverviewStats());
};
exports.getOverview = getOverview;
const getOverdue = (_req, res) => {
    const now = new Date().toISOString();
    const overdueIds = db.loansByDueDate.getSmallerThan(now);
    const overdue = Array.from(overdueIds)
        .map((id) => db.getLoan(id))
        .filter((loan) => loan && loan.status !== "RETURNED");
    res.status(200).json(overdue);
};
exports.getOverdue = getOverdue;
