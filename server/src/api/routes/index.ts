import { Router } from "express";
import { booksRouter } from "./booksRoutes";
import { readersRouter } from "./readersRoutes";
import { loansRouter } from "./loansRoutes";
import { reportsRouter } from "./reportsRoutes";

export const apiRouter = Router();

apiRouter.use("/books", booksRouter);
apiRouter.use("/readers", readersRouter);
apiRouter.use("/loans", loansRouter);
apiRouter.use("/reports", reportsRouter);
