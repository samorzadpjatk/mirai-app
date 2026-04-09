-- DropIndex
DROP INDEX "Group_tripId_isDeleted_idx";

-- CreateTable
CREATE TABLE "UserAgent" (
    "id" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "userId" TEXT,
    "endpoint" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAgent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserAgent_timestamp_idx" ON "UserAgent"("timestamp");

-- CreateIndex
CREATE INDEX "UserAgent_platform_idx" ON "UserAgent"("platform");

-- CreateIndex
CREATE INDEX "UserAgent_userId_idx" ON "UserAgent"("userId");

-- CreateIndex
CREATE INDEX "UserAgent_userAgent_idx" ON "UserAgent"("userAgent");
