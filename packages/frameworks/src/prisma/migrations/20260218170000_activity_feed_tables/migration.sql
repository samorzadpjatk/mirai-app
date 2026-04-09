-- CreateTable
CREATE TABLE "ActivityFeed" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "hiddenByAdmin" TEXT,
    "hiddenAt" TIMESTAMP(3),
    "hiddenReason" TEXT,
    "createdByAdmin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityFeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityReaction" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reactionType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionActivity" (
    "activityId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "hasVideo" BOOLEAN NOT NULL,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "ranking" INTEGER,
    "pointsAwarded" INTEGER,

    CONSTRAINT "SubmissionActivity_pkey" PRIMARY KEY ("activityId")
);

-- CreateTable
CREATE TABLE "ChallengeActivity" (
    "activityId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "endTime" TIMESTAMP(3),
    "submissionType" "SubmissionType",
    "basePoints" INTEGER,
    "submissionCount" INTEGER,

    CONSTRAINT "ChallengeActivity_pkey" PRIMARY KEY ("activityId")
);

-- CreateTable
CREATE TABLE "RankChangeActivity" (
    "activityId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "newRank" INTEGER NOT NULL,
    "totalCoins" INTEGER NOT NULL,
    "coinsGained" INTEGER NOT NULL,

    CONSTRAINT "RankChangeActivity_pkey" PRIMARY KEY ("activityId")
);

-- CreateTable
CREATE TABLE "UserPost" (
    "activityId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "additionalImages" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "UserPost_pkey" PRIMARY KEY ("activityId")
);

-- CreateIndex
CREATE INDEX "ActivityFeed_tripId_createdAt_idx" ON "ActivityFeed"("tripId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ActivityFeed_tripId_isPinned_idx" ON "ActivityFeed"("tripId", "isPinned");

-- CreateIndex
CREATE INDEX "ActivityFeed_tripId_isHidden_idx" ON "ActivityFeed"("tripId", "isHidden");

-- CreateIndex
CREATE INDEX "ActivityFeed_tripId_activityType_idx" ON "ActivityFeed"("tripId", "activityType");

-- CreateIndex
CREATE INDEX "ActivityReaction_activityId_idx" ON "ActivityReaction"("activityId");

-- CreateIndex
CREATE INDEX "ActivityReaction_userId_idx" ON "ActivityReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityReaction_activityId_userId_reactionType_key" ON "ActivityReaction"("activityId", "userId", "reactionType");

-- CreateIndex
CREATE INDEX "SubmissionActivity_submissionId_idx" ON "SubmissionActivity"("submissionId");

-- CreateIndex
CREATE INDEX "SubmissionActivity_challengeId_idx" ON "SubmissionActivity"("challengeId");

-- CreateIndex
CREATE INDEX "SubmissionActivity_groupId_idx" ON "SubmissionActivity"("groupId");

-- CreateIndex
CREATE INDEX "SubmissionActivity_isWinner_idx" ON "SubmissionActivity"("isWinner");

-- CreateIndex
CREATE INDEX "ChallengeActivity_challengeId_idx" ON "ChallengeActivity"("challengeId");

-- CreateIndex
CREATE INDEX "ChallengeActivity_eventType_idx" ON "ChallengeActivity"("eventType");

-- CreateIndex
CREATE INDEX "RankChangeActivity_groupId_idx" ON "RankChangeActivity"("groupId");

-- CreateIndex
CREATE INDEX "RankChangeActivity_newRank_idx" ON "RankChangeActivity"("newRank");

-- CreateIndex
CREATE INDEX "UserPost_authorId_idx" ON "UserPost"("authorId");

-- AddForeignKey
ALTER TABLE "ActivityFeed" ADD CONSTRAINT "ActivityFeed_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityFeed" ADD CONSTRAINT "ActivityFeed_hiddenByAdmin_fkey" FOREIGN KEY ("hiddenByAdmin") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityFeed" ADD CONSTRAINT "ActivityFeed_createdByAdmin_fkey" FOREIGN KEY ("createdByAdmin") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityReaction" ADD CONSTRAINT "ActivityReaction_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ActivityFeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityReaction" ADD CONSTRAINT "ActivityReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionActivity" ADD CONSTRAINT "SubmissionActivity_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ActivityFeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionActivity" ADD CONSTRAINT "SubmissionActivity_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ChallengeSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionActivity" ADD CONSTRAINT "SubmissionActivity_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionActivity" ADD CONSTRAINT "SubmissionActivity_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeActivity" ADD CONSTRAINT "ChallengeActivity_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ActivityFeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeActivity" ADD CONSTRAINT "ChallengeActivity_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankChangeActivity" ADD CONSTRAINT "RankChangeActivity_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ActivityFeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankChangeActivity" ADD CONSTRAINT "RankChangeActivity_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPost" ADD CONSTRAINT "UserPost_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ActivityFeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPost" ADD CONSTRAINT "UserPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "TripParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
