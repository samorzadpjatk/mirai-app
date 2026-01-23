-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeGroup" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChallengeGroup_groupId_idx" ON "ChallengeGroup"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeGroup_challengeId_groupId_key" ON "ChallengeGroup"("challengeId", "groupId");

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeGroup" ADD CONSTRAINT "ChallengeGroup_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeGroup" ADD CONSTRAINT "ChallengeGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
