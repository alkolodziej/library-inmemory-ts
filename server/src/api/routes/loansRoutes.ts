import { Router } from "express";
import { borrowBook, listLoans, returnBook } from "../controllers/loansController";

export const loansRouter = Router();

loansRouter.get("/", listLoans);
loansRouter.post("/borrow", borrowBook);
loansRouter.post("/return", returnBook);
