import { Request, Response } from "express";
import { DatabaseService } from "../../db/DatabaseService";

const db = DatabaseService.getInstance();

export const getOverview = (_req: Request, res: Response): void => {
  res.status(200).json(db.getOverviewStats());
};

export const getOverdue = (_req: Request, res: Response): void => {
  const now = new Date().toISOString();
  const overdueIds = db.loansByDueDate.getSmallerThan(now);
  
  const overdue = Array.from(overdueIds)
    .map((id) => db.getLoan(id))
    .filter((loan) => loan && loan.status !== "RETURNED");

  res.status(200).json(overdue);
};
