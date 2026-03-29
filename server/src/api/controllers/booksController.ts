import { randomUUID } from "node:crypto";
import { Request, Response } from "express";
import { Book } from "../../../../shared/src/models";
import { DatabaseService } from "../../db/DatabaseService";

const db = DatabaseService.getInstance();

export const listBooks = (_req: Request, res: Response): void => {
  res.status(200).json(db.listBooks());
};

export const createBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date().toISOString();

    const payload: Book = {
      id: req.body.id ?? randomUUID(),
      isbn: String(req.body.isbn),
      title: String(req.body.title),
      authors: Array.isArray(req.body.authors) ? req.body.authors : [],
      categories: Array.isArray(req.body.categories) ? req.body.categories : [],
      publishedYear: Number(req.body.publishedYear ?? new Date().getFullYear()),
      totalCopies: Number(req.body.totalCopies ?? 1),
      availableCopies: Number(req.body.availableCopies ?? req.body.totalCopies ?? 1),
      createdAt: now,
      updatedAt: now,
    };

    const created = db.addBook(payload);
    await db.saveAll();

    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};
