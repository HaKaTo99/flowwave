/*
  Warnings:

  - You are about to drop the column `result` on the `Execution` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Execution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "input" TEXT,
    "output" TEXT,
    "logs" TEXT,
    "duration" INTEGER,
    "errorMessage" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "Execution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Execution" ("completedAt", "id", "startedAt", "status", "workflowId") SELECT "completedAt", "id", "startedAt", "status", "workflowId" FROM "Execution";
DROP TABLE "Execution";
ALTER TABLE "new_Execution" RENAME TO "Execution";
CREATE TABLE "new_Workflow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "nodes" TEXT NOT NULL,
    "edges" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "metadata" TEXT,
    "localVersion" INTEGER NOT NULL DEFAULT 1,
    "cloudVersion" INTEGER,
    "syncStatus" TEXT NOT NULL DEFAULT 'local_only',
    "lastSyncedAt" DATETIME,
    "created_by" TEXT NOT NULL DEFAULT 'system',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Workflow" ("cloudVersion", "createdAt", "edges", "id", "isDeleted", "lastSyncedAt", "localVersion", "name", "nodes", "syncStatus", "updatedAt") SELECT "cloudVersion", "createdAt", "edges", "id", "isDeleted", "lastSyncedAt", "localVersion", "name", "nodes", "syncStatus", "updatedAt" FROM "Workflow";
DROP TABLE "Workflow";
ALTER TABLE "new_Workflow" RENAME TO "Workflow";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
