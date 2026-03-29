import { Router } from "express";
import { getOverdue, getOverview } from "../controllers/reportsController";

export const reportsRouter = Router();

reportsRouter.get("/overview", getOverview);
reportsRouter.get("/overdue", getOverdue);
