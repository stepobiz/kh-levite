-- CreateTable
CREATE TABLE "iot_device_param" (
    "device_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    PRIMARY KEY ("device_id", "key"),
    CONSTRAINT "iot_device_param_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "iot_device" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Preserve existing ipAddress/macAddress values as params before dropping the columns
INSERT INTO "iot_device_param" ("device_id", "key", "value")
SELECT "id", 'ipAddress', "ip_address" FROM "iot_device" WHERE "ip_address" IS NOT NULL AND "ip_address" != '';

INSERT INTO "iot_device_param" ("device_id", "key", "value")
SELECT "id", 'macAddress', "mac_address" FROM "iot_device" WHERE "mac_address" IS NOT NULL AND "mac_address" != '';

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_iot_device" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "deviceName" TEXT,
    "driver" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_iot_device" ("created_at", "deviceName", "driver", "id", "updated_at") SELECT "created_at", "deviceName", "driver", "id", "updated_at" FROM "iot_device";
DROP TABLE "iot_device";
ALTER TABLE "new_iot_device" RENAME TO "iot_device";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
