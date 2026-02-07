/*
  Warnings:

  - You are about to drop the column `points` on the `Challenge` table. All the data in the column will be lost.
  - You are about to drop the `ChallengeGroup` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `scoringCategory` to the `Challenge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `submissionType` to the `Challenge` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SubmissionType" AS ENUM ('IMAGE', 'MULTI_IMAGE', 'VIDEO', 'TEXT', 'IMAGE_LOCATION', 'LOCATION', 'QR_CODE');

-- CreateEnum
CREATE TYPE "ScoringCategory" AS ENUM ('SPEED', 'UNLIMITED', 'JUDGED_STAFF', 'PEER_VOTING');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('HIDDEN', 'VISIBLE', 'ACTIVE', 'VOTING_PHASE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "ChallengeGroup" DROP CONSTRAINT "ChallengeGroup_challengeId_fkey";

-- DropForeignKey
ALTER TABLE "ChallengeGroup" DROP CONSTRAINT "ChallengeGroup_groupId_fkey";

-- AlterTable
ALTER TABLE "Challenge" DROP COLUMN "points",
ADD COLUMN     "autoApprove" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "basePoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dailyEndTime" TEXT,
ADD COLUMN     "dailyStartTime" TEXT,
ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "firstPlacePoints" INTEGER,
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scoringCategory" "ScoringCategory" NOT NULL,
ADD COLUMN     "secondPlacePoints" INTEGER,
ADD COLUMN     "startTime" TIMESTAMP(3),
ADD COLUMN     "status" "ChallengeStatus" NOT NULL DEFAULT 'HIDDEN',
ADD COLUMN     "submissionType" "SubmissionType" NOT NULL,
ADD COLUMN     "targetLatitude" DOUBLE PRECISION,
ADD COLUMN     "targetLongitude" DOUBLE PRECISION,
ADD COLUMN     "thirdPlacePoints" INTEGER,
ADD COLUMN     "votingEndTime" TIMESTAMP(3),
ADD COLUMN     "votingStartTime" TIMESTAMP(3);

-- DropTable
DROP TABLE "ChallengeGroup";

-- CreateTable
CREATE TABLE "ChallengeSubmission" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videoUrl" TEXT,
    "textContent" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "awardedPoints" INTEGER NOT NULL DEFAULT 0,
    "bonusPoints" INTEGER NOT NULL DEFAULT 0,
    "ranking" INTEGER,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "voteScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallengeSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeVote" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "votePosition" INTEGER NOT NULL,
    "votePoints" INTEGER NOT NULL,
    "normalizedWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "votedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionReport" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChallengeSubmission_challengeId_status_idx" ON "ChallengeSubmission"("challengeId", "status");

-- CreateIndex
CREATE INDEX "ChallengeSubmission_groupId_idx" ON "ChallengeSubmission"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeSubmission_challengeId_groupId_key" ON "ChallengeSubmission"("challengeId", "groupId");

-- CreateIndex
CREATE INDEX "ChallengeVote_challengeId_idx" ON "ChallengeVote"("challengeId");

-- CreateIndex
CREATE INDEX "ChallengeVote_submissionId_idx" ON "ChallengeVote"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeVote_challengeId_submissionId_voterId_key" ON "ChallengeVote"("challengeId", "submissionId", "voterId");

-- CreateIndex
CREATE INDEX "SubmissionReport_submissionId_idx" ON "SubmissionReport"("submissionId");

-- CreateIndex
CREATE INDEX "Challenge_tripId_status_idx" ON "Challenge"("tripId", "status");

-- CreateIndex
CREATE INDEX "Challenge_isRecurring_idx" ON "Challenge"("isRecurring");

-- AddForeignKey
ALTER TABLE "ChallengeSubmission" ADD CONSTRAINT "ChallengeSubmission_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeSubmission" ADD CONSTRAINT "ChallengeSubmission_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeSubmission" ADD CONSTRAINT "ChallengeSubmission_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeVote" ADD CONSTRAINT "ChallengeVote_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeVote" ADD CONSTRAINT "ChallengeVote_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ChallengeSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeVote" ADD CONSTRAINT "ChallengeVote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "TripParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionReport" ADD CONSTRAINT "SubmissionReport_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ChallengeSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionReport" ADD CONSTRAINT "SubmissionReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "TripParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
