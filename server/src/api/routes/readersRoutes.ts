import { Router } from "express";
import { createReader, deleteReader, listReaders, updateReader } from "../controllers/readersController";

export const readersRouter = Router();

readersRouter.get("/", listReaders);
readersRouter.post("/", createReader);
readersRouter.put("/:id", updateReader);
readersRouter.delete("/:id", deleteReader);
