/*
  Warnings:

  - You are about to drop the column `publishedAt` on the `ModelVersion` table. All the data in the column will be lost.
  - Added the required column `json` to the `Model` table without a default value. This is not possible if the table is not empty.
  - Added the required column `json` to the `ModelVersion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gopeedTaskFinished` to the `ModelVersionFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gopeedTaskFinished` to the `ModelVersionImage` table without a default value. This is not possible if the table is not empty.

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
    "json" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Model_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Model_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ModelType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Model" ("createdAt", "creatorId", "id", "name", "nsfw", "nsfwLevel", "typeId", "updatedAt") SELECT "createdAt", "creatorId", "id", "name", "nsfw", "nsfwLevel", "typeId", "updatedAt" FROM "Model";
DROP TABLE "Model";
ALTER TABLE "new_Model" RENAME TO "Model";
CREATE INDEX "Model_name_typeId_creatorId_nsfw_nsfwLevel_idx" ON "Model"("name", "typeId", "creatorId", "nsfw", "nsfwLevel");
CREATE TABLE "new_ModelVersion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "modelId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "baseModelId" INTEGER NOT NULL,
    "baseModelTypeId" INTEGER,
    "nsfwLevel" INTEGER NOT NULL,
    "json" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ModelVersion_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ModelVersion_baseModelId_fkey" FOREIGN KEY ("baseModelId") REFERENCES "BaseModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ModelVersion_baseModelTypeId_fkey" FOREIGN KEY ("baseModelTypeId") REFERENCES "BaseModelType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ModelVersion" ("baseModelId", "baseModelTypeId", "createdAt", "id", "modelId", "name", "nsfwLevel", "updatedAt") SELECT "baseModelId", "baseModelTypeId", "createdAt", "id", "modelId", "name", "nsfwLevel", "updatedAt" FROM "ModelVersion";
DROP TABLE "ModelVersion";
ALTER TABLE "new_ModelVersion" RENAME TO "ModelVersion";
CREATE INDEX "ModelVersion_modelId_name_baseModelId_baseModelTypeId_nsfwLevel_idx" ON "ModelVersion"("modelId", "name", "baseModelId", "baseModelTypeId", "nsfwLevel");
CREATE TABLE "new_ModelVersionFile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sizeKB" REAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "downloadUrl" TEXT NOT NULL,
    "gopeedTaskId" TEXT,
    "gopeedTaskFinished" BOOLEAN NOT NULL,
    "gopeedTaskDeleted" BOOLEAN NOT NULL DEFAULT false,
    "modelVersionId" INTEGER NOT NULL,
    CONSTRAINT "ModelVersionFile_modelVersionId_fkey" FOREIGN KEY ("modelVersionId") REFERENCES "ModelVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ModelVersionFile" ("downloadUrl", "id", "modelVersionId", "name", "sizeKB", "type") SELECT "downloadUrl", "id", "modelVersionId", "name", "sizeKB", "type" FROM "ModelVersionFile";
DROP TABLE "ModelVersionFile";
ALTER TABLE "new_ModelVersionFile" RENAME TO "ModelVersionFile";
CREATE UNIQUE INDEX "ModelVersionFile_gopeedTaskId_key" ON "ModelVersionFile"("gopeedTaskId");
CREATE INDEX "ModelVersionFile_id_gopeedTaskId_idx" ON "ModelVersionFile"("id", "gopeedTaskId");
CREATE TABLE "new_ModelVersionImage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "nsfwLevel" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "gopeedTaskId" TEXT,
    "gopeedTaskFinished" BOOLEAN NOT NULL,
    "gopeedTaskDeleted" BOOLEAN NOT NULL DEFAULT false,
    "modelVersionId" INTEGER NOT NULL,
    CONSTRAINT "ModelVersionImage_modelVersionId_fkey" FOREIGN KEY ("modelVersionId") REFERENCES "ModelVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ModelVersionImage" ("hash", "height", "id", "modelVersionId", "nsfwLevel", "type", "url", "width") SELECT "hash", "height", "id", "modelVersionId", "nsfwLevel", "type", "url", "width" FROM "ModelVersionImage";
DROP TABLE "ModelVersionImage";
ALTER TABLE "new_ModelVersionImage" RENAME TO "ModelVersionImage";
CREATE UNIQUE INDEX "ModelVersionImage_gopeedTaskId_key" ON "ModelVersionImage"("gopeedTaskId");
CREATE INDEX "ModelVersionImage_id_gopeedTaskId_idx" ON "ModelVersionImage"("id", "gopeedTaskId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
