PRAGMA foreign_keys = OFF;

-- auen_node_type
CREATE TABLE "auen_node_type_new" (
    "id"         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name"       TEXT    NOT NULL,
    "icon_slug"  TEXT,
    "category"   TEXT    NOT NULL,
    "value_type" TEXT    NOT NULL DEFAULT 'boolean',
    CONSTRAINT "auen_node_type_category_value_type_key" UNIQUE ("category", "value_type")
);
INSERT INTO "auen_node_type_new" SELECT "id","name","icon_slug","category","value_type" FROM "auen_node_type";
DROP TABLE "auen_node_type";
ALTER TABLE "auen_node_type_new" RENAME TO "auen_node_type";

-- auen_attribute_type
CREATE TABLE "auen_attribute_type_new" (
    "id"          INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code"        TEXT    NOT NULL UNIQUE,
    "description" TEXT,
    "data_type"   TEXT    NOT NULL
);
INSERT INTO "auen_attribute_type_new" SELECT "id","code","description","data_type" FROM "auen_attribute_type";
DROP TABLE "auen_attribute_type";
ALTER TABLE "auen_attribute_type_new" RENAME TO "auen_attribute_type";

-- cfg_configuration
CREATE TABLE "cfg_configuration_new" (
    "code"        TEXT    NOT NULL PRIMARY KEY,
    "name"        TEXT    NOT NULL,
    "description" TEXT,
    "section_id"  INTEGER,
    "data_type"   TEXT    NOT NULL,
    "val_int"     INTEGER,
    "val_float"   REAL,
    "val_bool"    BOOLEAN,
    "val_text"    TEXT,
    CONSTRAINT "cfg_configuration_section_id_fkey"
        FOREIGN KEY ("section_id") REFERENCES "cfg_section" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "cfg_configuration_new" SELECT "code","name","description","section_id","data_type","val_int","val_float","val_bool","val_text" FROM "cfg_configuration";
DROP TABLE "cfg_configuration";
ALTER TABLE "cfg_configuration_new" RENAME TO "cfg_configuration";

PRAGMA foreign_keys = ON;
PRAGMA foreign_key_check;
