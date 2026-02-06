/*
  Warnings:

  - You are about to drop the column `previewFile` on the `Model` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Model" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "creatorId" INTEGER,
    "typeId" INTEGER NOT NULL,
    "nsfw" BOOLEAN NOT NULL,
    "nsfwLevel" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Model_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Model_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ModelType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Model" ("createdAt", "creatorId", "id", "name", "nsfw", "nsfwLevel", "typeId", "updatedAt") SELECT "createdAt", "creatorId", "id", "name", "nsfw", "nsfwLevel", "typeId", "updatedAt" FROM "Model";
DROP TABLE "Model";
ALTER TABLE "new_Model" RENAME TO "Model";
CREATE INDEX "Model_name_typeId_creatorId_nsfw_nsfwLevel_idx" ON "Model"("name", "typeId", "creatorId", "nsfw", "nsfwLevel");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
