import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";

const databaseUrl =
  process.env.DATABASE_URL?.replace(/^file:/, "") ?? "./prisma/dev.db";
const databasePath = join(process.cwd(), databaseUrl);
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
db.close();
