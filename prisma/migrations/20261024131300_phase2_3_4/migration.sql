-- CreateTable
CREATE TABLE "ProductionAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "attributes" TEXT NOT NULL DEFAULT '{}',
    "continuityRules" TEXT NOT NULL DEFAULT '[]',
    "approvalStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "canonicalMediaId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductionAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssetMedia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "isCanonical" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'USER',
    "providerId" TEXT,
    "modelId" TEXT,
    "prompt" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssetMedia_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "ProductionAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scene" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "sceneNumber" INTEGER NOT NULL,
    "heading" TEXT NOT NULL,
    "location" TEXT,
    "timeOfDay" TEXT,
    "actionSummary" TEXT NOT NULL,
    "estimatedDurationSeconds" INTEGER NOT NULL DEFAULT 30,
    "approvalStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Scene_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Shot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sceneId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "shotNumber" INTEGER NOT NULL,
    "actionDescription" TEXT NOT NULL,
    "shotSize" TEXT,
    "cameraAngle" TEXT,
    "cameraMovement" TEXT,
    "lighting" TEXT,
    "mood" TEXT,
    "imagePrompt" TEXT,
    "videoPrompt" TEXT,
    "negativeConstraints" TEXT NOT NULL DEFAULT '[]',
    "targetDurationSeconds" REAL NOT NULL DEFAULT 5,
    "aspectRatio" TEXT NOT NULL DEFAULT '16:9',
    "approvalStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "selectedStillId" TEXT,
    "selectedVideoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Shot_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShotAssetReference" (
    "shotId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OTHER',

    PRIMARY KEY ("shotId", "assetId"),
    CONSTRAINT "ShotAssetReference_shotId_fkey" FOREIGN KEY ("shotId") REFERENCES "Shot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShotAssetReference_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "ProductionAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShotMedia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shotId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "durationSeconds" REAL,
    "width" INTEGER,
    "height" INTEGER,
    "prompt" TEXT,
    "providerId" TEXT,
    "modelId" TEXT,
    "providerJobId" TEXT,
    "provenance" TEXT NOT NULL DEFAULT 'USER_UPLOAD',
    "approvalStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShotMedia_shotId_fkey" FOREIGN KEY ("shotId") REFERENCES "Shot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EditSequence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Main sequence',
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "frameRate" REAL NOT NULL DEFAULT 24,
    "width" INTEGER NOT NULL DEFAULT 1920,
    "height" INTEGER NOT NULL DEFAULT 1080,
    "timelineJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EditSequence_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExportJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "editSequenceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "exportSettings" TEXT NOT NULL DEFAULT '{}',
    "outputPath" TEXT,
    "outputFilename" TEXT,
    "outputFileSize" INTEGER,
    "outputChecksum" TEXT,
    "durationSeconds" REAL,
    "errorMessage" TEXT,
    "generationJobId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    CONSTRAINT "ExportJob_editSequenceId_fkey" FOREIGN KEY ("editSequenceId") REFERENCES "EditSequence" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProductionAsset_projectId_assetType_idx" ON "ProductionAsset"("projectId", "assetType");

-- CreateIndex
CREATE INDEX "AssetMedia_assetId_idx" ON "AssetMedia"("assetId");

-- CreateIndex
CREATE INDEX "Scene_projectId_idx" ON "Scene"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Scene_projectId_sceneNumber_key" ON "Scene"("projectId", "sceneNumber");

-- CreateIndex
CREATE INDEX "Shot_projectId_idx" ON "Shot"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Shot_sceneId_shotNumber_key" ON "Shot"("sceneId", "shotNumber");

-- CreateIndex
CREATE INDEX "ShotMedia_shotId_idx" ON "ShotMedia"("shotId");

-- CreateIndex
CREATE UNIQUE INDEX "ShotMedia_shotId_kind_versionNumber_key" ON "ShotMedia"("shotId", "kind", "versionNumber");

-- CreateIndex
CREATE INDEX "EditSequence_projectId_idx" ON "EditSequence"("projectId");

-- CreateIndex
CREATE INDEX "ExportJob_projectId_idx" ON "ExportJob"("projectId");
