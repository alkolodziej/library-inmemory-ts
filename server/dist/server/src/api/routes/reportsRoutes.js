"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsRouter = void 0;
const express_1 = require("express");
const reportsController_1 = require("../controllers/reportsController");
exports.reportsRouter = (0, express_1.Router)();
exports.reportsRouter.get("/overview", reportsController_1.getOverview);
exports.reportsRouter.get("/overdue", reportsController_1.getOverdue);
