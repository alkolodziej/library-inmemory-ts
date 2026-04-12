import { Router } from "express";
import { createBook, listBooks, updateBook, deleteBook } from "../controllers/booksController";

export const booksRouter = Router();

booksRouter.get("/", listBooks);
booksRouter.post("/", createBook);
booksRouter.put("/:id", updateBook);
booksRouter.delete("/:id", deleteBook);
