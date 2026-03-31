-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Keyword" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyword" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "checkInterval" INTEGER NOT NULL DEFAULT 30,
    "lastCheckedAt" DATETIME,
    "lastTriggeredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    CONSTRAINT "Keyword_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Hotspot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "summary" TEXT,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceId" TEXT,
    "category" TEXT,
    "heatScore" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isFake" BOOLEAN NOT NULL DEFAULT false,
    "fakeReason" TEXT,
    "keywordsMatched" TEXT,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "dataSourceId" TEXT,
    "userId" TEXT,
    CONSTRAINT "Hotspot_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Hotspot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "hotspotId" TEXT NOT NULL,
    CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Favorite_hotspotId_fkey" FOREIGN KEY ("hotspotId") REFERENCES "Hotspot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HeatHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "heatScore" INTEGER NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hotspotId" TEXT NOT NULL,
    CONSTRAINT "HeatHistory_hotspotId_fkey" FOREIGN KEY ("hotspotId") REFERENCES "Hotspot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" DATETIME,
    "error" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hotspotId" TEXT NOT NULL,
    "keywordId" TEXT,
    "userId" TEXT,
    CONSTRAINT "Notification_hotspotId_fkey" FOREIGN KEY ("hotspotId") REFERENCES "Hotspot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Notification_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notificationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "email" TEXT,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "aiProvider" TEXT NOT NULL DEFAULT 'openrouter',
    "aiApiKey" TEXT,
    "aiBaseUrl" TEXT,
    "aiModel" TEXT,
    "twitterApiKey" TEXT,
    "smtpHost" TEXT,
    "smtpPort" TEXT,
    "smtpUser" TEXT,
    "smtpPass" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "minScore" INTEGER NOT NULL DEFAULT 30,
    "lastFetched" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MonitorLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "context" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DataSourceHealth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dataSourceId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastCheckAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSuccessAt" DATETIME,
    "lastErrorAt" DATETIME,
    "lastError" TEXT,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTime" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DataSourceHealth_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_HotspotToKeyword" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_HotspotToKeyword_A_fkey" FOREIGN KEY ("A") REFERENCES "Hotspot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_HotspotToKeyword_B_fkey" FOREIGN KEY ("B") REFERENCES "Keyword" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Keyword_keyword_idx" ON "Keyword"("keyword");

-- CreateIndex
CREATE INDEX "Keyword_isActive_idx" ON "Keyword"("isActive");

-- CreateIndex
CREATE INDEX "Keyword_userId_idx" ON "Keyword"("userId");

-- CreateIndex
CREATE INDEX "Hotspot_source_idx" ON "Hotspot"("source");

-- CreateIndex
CREATE INDEX "Hotspot_category_idx" ON "Hotspot"("category");

-- CreateIndex
CREATE INDEX "Hotspot_heatScore_idx" ON "Hotspot"("heatScore");

-- CreateIndex
CREATE INDEX "Hotspot_createdAt_idx" ON "Hotspot"("createdAt");

-- CreateIndex
CREATE INDEX "Hotspot_userId_idx" ON "Hotspot"("userId");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE INDEX "Favorite_hotspotId_idx" ON "Favorite"("hotspotId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_hotspotId_key" ON "Favorite"("userId", "hotspotId");

-- CreateIndex
CREATE INDEX "HeatHistory_hotspotId_idx" ON "HeatHistory"("hotspotId");

-- CreateIndex
CREATE INDEX "HeatHistory_recordedAt_idx" ON "HeatHistory"("recordedAt");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "DataSource_type_idx" ON "DataSource"("type");

-- CreateIndex
CREATE INDEX "DataSource_isActive_idx" ON "DataSource"("isActive");

-- CreateIndex
CREATE INDEX "MonitorLog_level_idx" ON "MonitorLog"("level");

-- CreateIndex
CREATE INDEX "MonitorLog_createdAt_idx" ON "MonitorLog"("createdAt");

-- CreateIndex
CREATE INDEX "MonitorLog_context_idx" ON "MonitorLog"("context");

-- CreateIndex
CREATE UNIQUE INDEX "DataSourceHealth_dataSourceId_key" ON "DataSourceHealth"("dataSourceId");

-- CreateIndex
CREATE INDEX "DataSourceHealth_status_idx" ON "DataSourceHealth"("status");

-- CreateIndex
CREATE INDEX "DataSourceHealth_lastCheckAt_idx" ON "DataSourceHealth"("lastCheckAt");

-- CreateIndex
CREATE UNIQUE INDEX "_HotspotToKeyword_AB_unique" ON "_HotspotToKeyword"("A", "B");

-- CreateIndex
CREATE INDEX "_HotspotToKeyword_B_index" ON "_HotspotToKeyword"("B");
