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

function ensureColumn(tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info('${tableName}')`).all();
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    db.exec(`ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${definition}`);
  }
}

const todoColumns = db.prepare("PRAGMA table_info('Todo')").all();
const hasSortOrder = todoColumns.some((column) => column.name === "sortOrder");

if (!hasSortOrder) {
  db.exec('ALTER TABLE "Todo" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0');
}

ensureColumn("Todo", "projectId", 'TEXT REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE');

db.exec(
  `
  CREATE INDEX IF NOT EXISTS "Todo_status_sortOrder_idx" ON "Todo"("status", "sortOrder");
  CREATE INDEX IF NOT EXISTS "Todo_projectId_idx" ON "Todo"("projectId");
  CREATE INDEX IF NOT EXISTS "Project_status_sortOrder_idx" ON "Project"("status", "sortOrder");
  CREATE INDEX IF NOT EXISTS "Project_priority_idx" ON "Project"("priority");
  CREATE INDEX IF NOT EXISTS "Project_dueDate_idx" ON "Project"("dueDate");
  `,
);

function backfillSortOrder(tableName) {
  const unorderedRows = db
    .prepare(
      `SELECT "id", "status" FROM "${tableName}" WHERE "sortOrder" = 0 ORDER BY "status" ASC, "createdAt" ASC`,
    )
    .all();
  const nextOrderByStatus = new Map();
  const maxRows = db
    .prepare(
      `SELECT "status", MAX("sortOrder") AS "maxOrder" FROM "${tableName}" GROUP BY "status"`,
    )
    .all();

  for (const row of maxRows) {
    nextOrderByStatus.set(row.status, Number(row.maxOrder ?? 0) + 1000);
  }

  const updateSortOrder = db.prepare(
    `UPDATE "${tableName}" SET "sortOrder" = ? WHERE "id" = ?`,
  );

  for (const row of unorderedRows) {
    const nextOrder = nextOrderByStatus.get(row.status) ?? 1000;
    updateSortOrder.run(nextOrder, row.id);
    nextOrderByStatus.set(row.status, nextOrder + 1000);
  }
}

backfillSortOrder("Todo");
backfillSortOrder("Project");

db.close();
