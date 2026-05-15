CREATE TABLE "auen_node_type_attribute" (
    "node_type_id" INTEGER NOT NULL,
    "attribute_id" INTEGER NOT NULL,
    "is_required"  BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "auen_node_type_attribute_node_type_id_fkey"
        FOREIGN KEY ("node_type_id") REFERENCES "auen_node_type" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "auen_node_type_attribute_attribute_id_fkey"
        FOREIGN KEY ("attribute_id") REFERENCES "auen_attribute_type" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    PRIMARY KEY ("node_type_id", "attribute_id")
);
