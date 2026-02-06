-- CreateTable
CREATE TABLE "Creator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL COLLATE NOCASE,
    "link" TEXT,
    "image" TEXT
);

-- CreateTable
CREATE TABLE "ModelType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Model" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL COLLATE NOCASE,
    "creatorId" INTEGER,
    "typeId" INTEGER NOT NULL,
    "nsfw" BOOLEAN NOT NULL,
    "nsfwLevel" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Model_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Model_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ModelType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL COLLATE NOCASE
);

-- CreateTable
CREATE TABLE "BaseModel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "BaseModelType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "baseModelId" INTEGER NOT NULL,
    CONSTRAINT "BaseModelType_baseModelId_fkey" FOREIGN KEY ("baseModelId") REFERENCES "BaseModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModelVersion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "modelId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "baseModelId" INTEGER NOT NULL,
    "baseModelTypeId" INTEGER,
    "publishedAt" DATETIME,
    "nsfwLevel" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ModelVersion_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ModelVersion_baseModelId_fkey" FOREIGN KEY ("baseModelId") REFERENCES "BaseModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ModelVersion_baseModelTypeId_fkey" FOREIGN KEY ("baseModelTypeId") REFERENCES "BaseModelType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModelVersionFile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sizeKB" REAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "downloadUrl" TEXT NOT NULL,
    "modelVersionId" INTEGER NOT NULL,
    CONSTRAINT "ModelVersionFile_modelVersionId_fkey" FOREIGN KEY ("modelVersionId") REFERENCES "ModelVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModelVersionImage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "nsfwLevel" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "modelVersionId" INTEGER NOT NULL,
    CONSTRAINT "ModelVersionImage_modelVersionId_fkey" FOREIGN KEY ("modelVersionId") REFERENCES "ModelVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ModelToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ModelToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Model" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ModelToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Creator_username_key" ON "Creator"("username");

-- CreateIndex
CREATE INDEX "Creator_username_idx" ON "Creator"("username");

-- CreateIndex
CREATE UNIQUE INDEX "ModelType_name_key" ON "ModelType"("name");

-- CreateIndex
CREATE INDEX "ModelType_name_idx" ON "ModelType"("name");

-- CreateIndex
CREATE INDEX "Model_name_typeId_creatorId_nsfw_nsfwLevel_idx" ON "Model"("name", "typeId", "creatorId", "nsfw", "nsfwLevel");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BaseModel_name_key" ON "BaseModel"("name");

-- CreateIndex
CREATE INDEX "BaseModel_name_idx" ON "BaseModel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BaseModelType_name_key" ON "BaseModelType"("name");

-- CreateIndex
CREATE INDEX "BaseModelType_name_baseModelId_idx" ON "BaseModelType"("name", "baseModelId");

-- CreateIndex
CREATE INDEX "ModelVersion_modelId_name_baseModelId_baseModelTypeId_publishedAt_nsfwLevel_idx" ON "ModelVersion"("modelId", "name", "baseModelId", "baseModelTypeId", "publishedAt", "nsfwLevel");

-- CreateIndex
CREATE UNIQUE INDEX "_ModelToTag_AB_unique" ON "_ModelToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_ModelToTag_B_index" ON "_ModelToTag"("B");
