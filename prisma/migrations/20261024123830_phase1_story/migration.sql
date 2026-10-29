-- CreateTable
CREATE TABLE "ProviderConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "displayName" TEXT,
    "encryptedKey" TEXT NOT NULL,
    "keyVersion" TEXT NOT NULL DEFAULT 'v1',
    "status" TEXT NOT NULL DEFAULT 'NOT_TESTED',
    "lastVerifiedAt" DATETIME,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProviderConnection_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModelPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "providerConnectionId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "fallbackMode" TEXT NOT NULL DEFAULT 'MANUAL_ONLY',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ModelPreference_providerConnectionId_fkey" FOREIGN KEY ("providerConnectionId") REFERENCES "ProviderConnection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoryArtifact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "artifactType" TEXT NOT NULL,
    "currentVersionId" TEXT,
    "approvalStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoryArtifact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArtifactVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "artifactId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "contentText" TEXT NOT NULL,
    "contentJson" TEXT NOT NULL DEFAULT '{}',
    "source" TEXT NOT NULL DEFAULT 'AI',
    "providerId" TEXT,
    "modelId" TEXT,
    "generationJobId" TEXT,
    "createdByUserId" TEXT,
    "changeSummary" TEXT,
    "approvedAt" DATETIME,
    "approvedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArtifactVersion_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "StoryArtifact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currentStage" TEXT NOT NULL DEFAULT 'BRIEF',
    "sourceIdea" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "genre" TEXT,
    "tone" TEXT,
    "visualStyle" TEXT NOT NULL DEFAULT 'PHOTOREALISTIC_CINEMATIC',
    "dialogueMode" TEXT NOT NULL DEFAULT 'DIALOGUE',
    "targetRuntime" INTEGER NOT NULL DEFAULT 360,
    "aspectRatio" TEXT NOT NULL DEFAULT 'LANDSCAPE_16_9',
    "audience" TEXT,
    "storyLanguage" TEXT NOT NULL DEFAULT 'en',
    CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("createdAt", "currentStage", "description", "id", "ownerId", "sourceIdea", "status", "title", "updatedAt") SELECT "createdAt", "currentStage", "description", "id", "ownerId", "sourceIdea", "status", "title", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE INDEX "Project_ownerId_idx" ON "Project"("ownerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ProviderConnection_ownerId_providerId_idx" ON "ProviderConnection"("ownerId", "providerId");

-- CreateIndex
CREATE INDEX "ModelPreference_ownerId_idx" ON "ModelPreference"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "ModelPreference_ownerId_taskType_key" ON "ModelPreference"("ownerId", "taskType");

-- CreateIndex
CREATE INDEX "StoryArtifact_projectId_idx" ON "StoryArtifact"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryArtifact_projectId_artifactType_key" ON "StoryArtifact"("projectId", "artifactType");

-- CreateIndex
CREATE INDEX "ArtifactVersion_artifactId_idx" ON "ArtifactVersion"("artifactId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtifactVersion_artifactId_versionNumber_key" ON "ArtifactVersion"("artifactId", "versionNumber");
