import { mkdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import Database from "better-sqlite3";

const databaseUrl =
  process.env.DATABASE_URL?.replace(/^file:/, "") ?? "./prisma/dev.db";
const databasePath = isAbsolute(databaseUrl)
  ? databaseUrl
  : join(process.cwd(), databaseUrl);
const migrationPath = join(
  process.cwd(),
  "prisma",
  "migrations",
  "20260530000000_init",
  "migration.sql",
);

mkdirSync(dirname(databasePath), { recursive: true });

const db = new Database(databasePath);
db.exec(readFileSync(migrationPath, "utf8"));

const todoColumns = db.prepare("PRAGMA table_info('Todo')").all();
const hasSortOrder = todoColumns.some((column) => column.name === "sortOrder");

if (!hasSortOrder) {
  db.exec('ALTER TABLE "Todo" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0');
}

db.exec(
  'CREATE INDEX IF NOT EXISTS "Todo_status_sortOrder_idx" ON "Todo"("status", "sortOrder")',
);

const unorderedTodos = db
  .prepare(
    'SELECT "id", "status" FROM "Todo" WHERE "sortOrder" = 0 ORDER BY "status" ASC, "createdAt" ASC',
  )
  .all();
const nextOrderByStatus = new Map();
const maxRows = db
  .prepare('SELECT "status", MAX("sortOrder") AS "maxOrder" FROM "Todo" GROUP BY "status"')
  .all();

for (const row of maxRows) {
  nextOrderByStatus.set(row.status, Number(row.maxOrder ?? 0) + 1000);
}

const updateSortOrder = db.prepare(
  'UPDATE "Todo" SET "sortOrder" = ? WHERE "id" = ?',
);

for (const todo of unorderedTodos) {
  const nextOrder = nextOrderByStatus.get(todo.status) ?? 1000;
  updateSortOrder.run(nextOrder, todo.id);
  nextOrderByStatus.set(todo.status, nextOrder + 1000);
}

db.close();
