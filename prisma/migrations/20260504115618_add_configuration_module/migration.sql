-- CreateTable
CREATE TABLE "cfg_section" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "cfg_configuration" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "section_id" INTEGER,
    "data_type" TEXT NOT NULL,
    "val_int" INTEGER,
    "val_float" REAL,
    "val_bool" BOOLEAN,
    "val_text" TEXT,
    CONSTRAINT "cfg_configuration_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "cfg_section" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "cfg_section_code_key" ON "cfg_section"("code");
