-- AlterTable
ALTER TABLE "Reward"
ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Reward_isHidden_idx" ON "Reward"("isHidden");
