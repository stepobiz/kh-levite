/*
  Warnings:

  - Added the required column `updated_at` to the `iot_device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `iot_device_component` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_iot_device" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "deviceName" TEXT,
    "mac_address" TEXT,
    "ip_address" TEXT NOT NULL,
    "driver" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_iot_device" ("deviceName", "driver", "id", "ip_address", "mac_address") SELECT "deviceName", "driver", "id", "ip_address", "mac_address" FROM "iot_device";
DROP TABLE "iot_device";
ALTER TABLE "new_iot_device" RENAME TO "iot_device";
CREATE UNIQUE INDEX "iot_device_mac_address_key" ON "iot_device"("mac_address");
CREATE TABLE "new_iot_device_component" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "device_id" INTEGER NOT NULL,
    "component_name" TEXT,
    "hardware_index" INTEGER NOT NULL,
    "hardware_address" TEXT,
    "next_value" TEXT,
    "next_value_updated_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "iot_device_component_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "iot_device" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_iot_device_component" ("component_name", "device_id", "hardware_address", "hardware_index", "id", "next_value") SELECT "component_name", "device_id", "hardware_address", "hardware_index", "id", "next_value" FROM "iot_device_component";
DROP TABLE "iot_device_component";
ALTER TABLE "new_iot_device_component" RENAME TO "iot_device_component";
CREATE INDEX "iot_device_component_device_id_idx" ON "iot_device_component"("device_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
