-- AlterTable
ALTER TABLE "auen_node_type" ADD COLUMN "is_system" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "auen_attribute_type" ADD COLUMN "is_system" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "cfg_configuration" ADD COLUMN "is_system" BOOLEAN NOT NULL DEFAULT false;
