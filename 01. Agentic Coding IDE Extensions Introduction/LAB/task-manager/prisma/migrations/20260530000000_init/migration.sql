CREATE TABLE IF NOT EXISTS "Project" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'todo',
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "dueDate" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Todo" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'todo',
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "dueDate" DATETIME,
  "projectId" TEXT REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS "Todo_status_idx" ON "Todo"("status");
CREATE INDEX IF NOT EXISTS "Todo_priority_idx" ON "Todo"("priority");
CREATE INDEX IF NOT EXISTS "Todo_dueDate_idx" ON "Todo"("dueDate");
CREATE INDEX IF NOT EXISTS "Project_status_idx" ON "Project"("status");
CREATE INDEX IF NOT EXISTS "Project_status_sortOrder_idx" ON "Project"("status", "sortOrder");
CREATE INDEX IF NOT EXISTS "Project_priority_idx" ON "Project"("priority");
CREATE INDEX IF NOT EXISTS "Project_dueDate_idx" ON "Project"("dueDate");
