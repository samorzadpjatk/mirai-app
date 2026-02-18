-- CreateEnum
CREATE TYPE "RewardPurchaseStatus" AS ENUM ('BOUGHT', 'ACCEPTED', 'IN_DELIVERY', 'CANCELLED', 'DELIVERED');

-- AlterTable
ALTER TABLE "RewardPurchase"
ADD COLUMN "status" "RewardPurchaseStatus" NOT NULL DEFAULT 'BOUGHT',
ADD COLUMN "collectionMethod" TEXT;

-- CreateIndex
CREATE INDEX "RewardPurchase_status_idx" ON "RewardPurchase"("status");
