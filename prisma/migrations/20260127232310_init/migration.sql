-- CreateTable
CREATE TABLE "iot_device" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "deviceName" TEXT,
    "mac_address" TEXT,
    "ip_address" TEXT NOT NULL,
    "driver" TEXT
);

-- CreateTable
CREATE TABLE "iot_device_component" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "device_id" INTEGER NOT NULL,
    "component_name" TEXT,
    "hardware_index" INTEGER NOT NULL,
    "hardware_address" TEXT,
    "next_value" TEXT,
    CONSTRAINT "iot_device_component_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "iot_device" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "iot_telemetry_log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "component_id" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "iot_telemetry_log_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "iot_device_component" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "iot_device_mac_address_key" ON "iot_device"("mac_address");

-- CreateIndex
CREATE INDEX "iot_telemetry_log_component_id_created_at_idx" ON "iot_telemetry_log"("component_id", "created_at");
