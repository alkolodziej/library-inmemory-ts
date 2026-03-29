"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const DatabaseService_1 = require("./db/DatabaseService");
const PORT = Number(process.env.PORT ?? 4000);
const bootstrap = async () => {
    const db = DatabaseService_1.DatabaseService.getInstance();
    await db.loadAll();
    const app = (0, app_1.createApp)();
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
