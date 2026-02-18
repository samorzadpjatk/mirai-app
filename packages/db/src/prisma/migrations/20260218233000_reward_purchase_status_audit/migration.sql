-- AlterTable
ALTER TABLE "RewardPurchase"
ADD COLUMN "statusUpdatedById" TEXT,
ADD COLUMN "statusUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing rows
UPDATE "RewardPurchase"
SET "statusUpdatedById" = "purchasedById",
    "statusUpdatedAt" = "purchasedAt"
WHERE "statusUpdatedById" IS NULL;

-- CreateIndex
CREATE INDEX "RewardPurchase_statusUpdatedById_idx" ON "RewardPurchase"("statusUpdatedById");

-- AddForeignKey
ALTER TABLE "RewardPurchase"
ADD CONSTRAINT "RewardPurchase_statusUpdatedById_fkey"
FOREIGN KEY ("statusUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
