-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_auen_node" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT,
    "description" TEXT,
    "type_id" INTEGER NOT NULL,
    "parent_id" INTEGER,
    "desired_value" TEXT NOT NULL DEFAULT '0',
    "desired_value_updated_at" DATETIME,
    "actual_value" TEXT NOT NULL DEFAULT '0',
    "actual_value_updated_at" DATETIME,
    CONSTRAINT "auen_node_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "auen_node_type" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "auen_node_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "auen_node" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_auen_node" ("actual_value", "actual_value_updated_at", "code", "description", "desired_value", "desired_value_updated_at", "id", "parent_id", "type_id") SELECT "actual_value", "actual_value_updated_at", "code", "description", "desired_value", "desired_value_updated_at", "id", "parent_id", "type_id" FROM "auen_node";
DROP TABLE "auen_node";
ALTER TABLE "new_auen_node" RENAME TO "auen_node";
CREATE UNIQUE INDEX "auen_node_code_key" ON "auen_node"("code");
CREATE INDEX "auen_node_parent_id_idx" ON "auen_node"("parent_id");
CREATE TABLE "new_auen_node_type" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "icon_slug" TEXT,
    "category" TEXT NOT NULL,
    "value_type" TEXT NOT NULL DEFAULT 'boolean'
);
INSERT INTO "new_auen_node_type" ("category", "icon_slug", "id", "name") SELECT "category", "icon_slug", "id", "name" FROM "auen_node_type";
DROP TABLE "auen_node_type";
ALTER TABLE "new_auen_node_type" RENAME TO "auen_node_type";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
