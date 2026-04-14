import { randomUUID } from "node:crypto";
import { Request, Response } from "express";
import { Reader } from "../../../../shared/src/models";
import { DatabaseService } from "../../db/DatabaseService";

const db = DatabaseService.getInstance();

export const listReaders = (_req: Request, res: Response): void => {
  res.status(200).json(db.listReaders());
};

export const createReader = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date().toISOString();

    const payload: Reader = {
      id: req.body.id ?? randomUUID(),
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
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteReader = async (req: Request, res: Response): Promise<void> => {
  try {
    db.removeReader(String(req.params.id));
    await db.saveAll();

    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const updateReader = async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = db.updateReader(String(req.params.id), {
      firstName: req.body.firstName !== undefined ? String(req.body.firstName) : undefined,
      lastName: req.body.lastName !== undefined ? String(req.body.lastName) : undefined,
      email: req.body.email !== undefined ? String(req.body.email) : undefined,
      status: req.body.status,
    });

    await db.saveAll();
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};
