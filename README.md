# Library Management System

Team project by Alan Kołodziej and Błażej Knap.

A TypeScript application for managing a library catalogue, readers and loans. It includes overdue-loan reports and simulates late fees. The React client is in `client/`, the Express API is in `server/`, and shared types are in `shared/`. The API uses in-memory indexes and stores local snapshots in `server/data/`.

## Run locally

Use Node.js 22.12 or later. From the repository root, run these commands in separate terminals.

```sh
cd server
npm ci
mkdir -p data
cp -n demo-data/*.json data/
npm run dev
```

```sh
cd client
npm ci
npm run dev
```

Open `http://localhost:5173`. Vite proxies API requests to port 4000. The optional copy step populates an empty catalogue with synthetic data and preserves existing snapshots. The API has no authentication and writes to the ignored `server/data/` directory.
