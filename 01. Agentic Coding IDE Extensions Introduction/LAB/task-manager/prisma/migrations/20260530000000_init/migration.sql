CREATE TABLE IF NOT EXISTS "Todo" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'todo',
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "dueDate" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS "Todo_status_idx" ON "Todo"("status");
CREATE INDEX IF NOT EXISTS "Todo_priority_idx" ON "Todo"("priority");
CREATE INDEX IF NOT EXISTS "Todo_dueDate_idx" ON "Todo"("dueDate");
