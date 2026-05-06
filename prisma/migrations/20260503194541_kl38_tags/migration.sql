-- CreateTable
CREATE TABLE "auen_tag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "auen_node_tag" (
    "node_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    PRIMARY KEY ("node_id", "tag_id"),
    CONSTRAINT "auen_node_tag_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "auen_node" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "auen_node_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "auen_tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "auen_tag_name_key" ON "auen_tag"("name");
