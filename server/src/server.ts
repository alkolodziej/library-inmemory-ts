import { createApp } from "./app";
import { DatabaseService } from "./db/DatabaseService";

const PORT = Number(process.env.PORT ?? 4000);

const bootstrap = async () => {
  const db = DatabaseService.getInstance();
  await db.loadAll();

  const app = createApp();

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${PORT}`);
  });
};

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", error);
  process.exit(1);
});
