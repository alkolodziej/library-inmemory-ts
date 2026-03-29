import { Router } from "express";
import { createBook, listBooks } from "../controllers/booksController";

export const booksRouter = Router();

booksRouter.get("/", listBooks);
booksRouter.post("/", createBook);
