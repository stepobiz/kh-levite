-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_iot_device_component" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "device_id" INTEGER NOT NULL,
    "component_name" TEXT,
    "hardware_address" TEXT,
    "next_value" TEXT,
    "next_value_updated_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "iot_device_component_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "iot_device" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_iot_device_component" ("component_name", "created_at", "device_id", "hardware_address", "id", "next_value", "next_value_updated_at", "updated_at") SELECT "component_name", "created_at", "device_id", "hardware_address", "id", "next_value", "next_value_updated_at", "updated_at" FROM "iot_device_component";
DROP TABLE "iot_device_component";
ALTER TABLE "new_iot_device_component" RENAME TO "iot_device_component";
CREATE INDEX "iot_device_component_device_id_idx" ON "iot_device_component"("device_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

