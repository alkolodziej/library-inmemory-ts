import { Request, Response } from "express";
import { DatabaseService } from "../../db/DatabaseService";

const db = DatabaseService.getInstance();

export const getOverview = (_req: Request, res: Response): void => {
  res.status(200).json(db.getOverviewStats());
};

export const getOverdue = (_req: Request, res: Response): void => {
  const now = Date.now();
  const overdue = db
    .listLoans()
    .filter((loan) => loan.status !== "RETURNED" && new Date(loan.dueAt).getTime() < now);

  res.status(200).json(overdue);
};
