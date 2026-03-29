"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loansRouter = void 0;
const express_1 = require("express");
const loansController_1 = require("../controllers/loansController");
exports.loansRouter = (0, express_1.Router)();
exports.loansRouter.get("/", loansController_1.listLoans);
exports.loansRouter.post("/borrow", loansController_1.borrowBook);
exports.loansRouter.post("/return", loansController_1.returnBook);
