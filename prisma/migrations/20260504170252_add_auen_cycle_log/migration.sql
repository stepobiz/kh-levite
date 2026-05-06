-- CreateTable
CREATE TABLE "auen_cycle_log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "started_at" DATETIME NOT NULL,
    "ended_at" DATETIME NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "node_count" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "error_msg" TEXT
);
