-- CreateTable
CREATE TABLE "auen_node_type" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "icon_slug" TEXT,
    "category" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "auen_node" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "auen_attribute_type" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "data_type" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "auen_node_attribute" (
    "node_id" INTEGER NOT NULL,
    "attribute_id" INTEGER NOT NULL,
    "value" TEXT NOT NULL,

    PRIMARY KEY ("node_id", "attribute_id"),
    CONSTRAINT "auen_node_attribute_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "auen_node" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "auen_node_attribute_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "auen_attribute_type" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_iot_device" ("created_at", "deviceName", "driver", "id", "ip_address", "mac_address", "updated_at") SELECT "created_at", "deviceName", "driver", "id", "ip_address", "mac_address", "updated_at" FROM "iot_device";
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
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "iot_device_component_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "iot_device" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_iot_device_component" ("component_name", "created_at", "device_id", "hardware_address", "hardware_index", "id", "next_value", "next_value_updated_at", "updated_at") SELECT "component_name", "created_at", "device_id", "hardware_address", "hardware_index", "id", "next_value", "next_value_updated_at", "updated_at" FROM "iot_device_component";
DROP TABLE "iot_device_component";
ALTER TABLE "new_iot_device_component" RENAME TO "iot_device_component";
CREATE INDEX "iot_device_component_device_id_idx" ON "iot_device_component"("device_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "auen_node_code_key" ON "auen_node"("code");

-- CreateIndex
CREATE INDEX "auen_node_parent_id_idx" ON "auen_node"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "auen_attribute_type_code_key" ON "auen_attribute_type"("code");
