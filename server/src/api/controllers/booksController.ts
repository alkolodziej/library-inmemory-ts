import { randomUUID } from "node:crypto";
import { Request, Response } from "express";
import { Book } from "../../../../shared/src/models";
import { DatabaseService } from "../../db/DatabaseService";

const db = DatabaseService.getInstance();

export const listBooks = (req: Request, res: Response): void => {
  const { title, author, category, isbn } = req.query;

  let resultIds: Set<string> | null = null;

  if (typeof title === "string" && title.trim() !== "") {
    resultIds = db.booksByTitle.searchPrefix(title.trim());
  }

  if (typeof author === "string" && author.trim() !== "") {
    const authorIds = db.searchBooksByAuthorPrefix(author.trim());
    if (resultIds) {
      resultIds = new Set([...resultIds].filter(id => authorIds.has(id)));
    } else {
      resultIds = authorIds;
    }
  }

  if (typeof category === "string" && category.trim() !== "") {
    const categoryIds = db.searchBooksByCategoryPrefix(category.trim());
    if (resultIds) {
      resultIds = new Set([...resultIds].filter(id => categoryIds.has(id)));
    } else {
      resultIds = categoryIds;
    }
  }

  if (typeof isbn === "string" && isbn.trim() !== "") {
    const isbnIds = db.searchBooksByIsbnPrefix(isbn.trim());
    if (resultIds) {
      resultIds = new Set([...resultIds].filter(id => isbnIds.has(id)));
    } else {
      resultIds = isbnIds;
    }
  }

  if (resultIds !== null) {
    const books = Array.from(resultIds).map(id => db.getBook(id)).filter(Boolean);
    res.status(200).json(books);
    return;
  }

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
      availableCopies: Number(req.body.totalCopies ?? 1),
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

export const updateBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const body = req.body;
    
    // We expect authors and categories to be array of strings, or undefined
    const updates: Partial<Book> = { ...body };
    if (body.authors && Array.isArray(body.authors)) {
      updates.authors = body.authors;
    }
    if (body.categories && Array.isArray(body.categories)) {
      updates.categories = body.categories;
    }
    
    const updated = db.updateBook(id, updates);
    await db.saveAll();

    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteBook = async (req: Request, res: Response): Promise<void> => {
  try {
    db.removeBook(String(req.params.id));
    await db.saveAll();
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};
