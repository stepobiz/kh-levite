ALTER TABLE "auen_node" ADD COLUMN "iot_component_id" INTEGER;
ALTER TABLE "auen_node" ADD COLUMN "is_logical"       BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "auen_node" ADD COLUMN "node_order"       INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX "auen_node_iot_component_id_key" ON "auen_node"("iot_component_id") WHERE "iot_component_id" IS NOT NULL;
