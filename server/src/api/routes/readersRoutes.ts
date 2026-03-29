import { Router } from "express";
import { createReader, deleteReader, listReaders } from "../controllers/readersController";

export const readersRouter = Router();

readersRouter.get("/", listReaders);
readersRouter.post("/", createReader);
readersRouter.delete("/:id", deleteReader);
