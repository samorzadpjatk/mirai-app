-- AlterTable
ALTER TABLE "Group"
ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Group_tripId_isDeleted_idx" ON "Group"("tripId", "isDeleted");
