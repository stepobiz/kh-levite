CREATE TABLE "sys_process_log" (
    "id"           INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "process_name" TEXT    NOT NULL,
    "started_at"   DATETIME NOT NULL,
    "ended_at"     DATETIME NOT NULL,
    "duration_ms"  INTEGER  NOT NULL,
    "item_count"   INTEGER  NOT NULL,
    "status"       TEXT     NOT NULL,
    "error_msg"    TEXT
);

CREATE INDEX "sys_process_log_process_name_idx" ON "sys_process_log"("process_name");
CREATE INDEX "sys_process_log_started_at_idx"   ON "sys_process_log"("started_at");
