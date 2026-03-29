import { Request, Response } from "express";
import { DatabaseService } from "../../db/DatabaseService";

const db = DatabaseService.getInstance();

export const listLoans = (_req: Request, res: Response): void => {
  res.status(200).json(db.listLoans());
};

export const borrowBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const loan = db.borrowBook({
      readerId: String(req.body.readerId),
      bookId: String(req.body.bookId),
      days: Number(req.body.days ?? 14),
    });

    await db.saveAll();
    res.status(201).json(loan);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const returnBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const loan = db.returnBook({
      loanId: String(req.body.loanId),
    });

    await db.saveAll();
    res.status(200).json(loan);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};
