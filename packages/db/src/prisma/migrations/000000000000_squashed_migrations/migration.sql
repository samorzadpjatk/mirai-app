-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'MODERATOR', 'SERVICE');

-- CreateEnum
CREATE TYPE "SubmissionType" AS ENUM ('IMAGE', 'MULTI_IMAGE', 'VIDEO', 'TEXT', 'IMAGE_LOCATION', 'LOCATION', 'QR_CODE');

-- CreateEnum
CREATE TYPE "ScoringCategory" AS ENUM ('SPEED', 'UNLIMITED', 'JUDGED_STAFF', 'PEER_VOTING');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('HIDDEN', 'VISIBLE', 'ACTIVE', 'VOTING_PHASE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LocationSharingRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RewardPurchaseStatus" AS ENUM ('BOUGHT', 'ACCEPTED', 'IN_DELIVERY', 'CANCELLED', 'DELIVERED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "hasAvatar" BOOLEAN NOT NULL DEFAULT false,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "last_seen_on" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "backgroundImagePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripResource" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "storagePath" TEXT,
    "fileName" TEXT,
    "publicUrl" TEXT,
    "iconName" TEXT,
    "value" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripInsurance" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "phoneDisplay" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "hospitalName" TEXT,
    "hospitalAddress" TEXT,
    "hospitalDistance" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripInsurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripInsuranceStep" (
    "id" TEXT NOT NULL,
    "insuranceId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "requiredInfo" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "exampleCall" TEXT,
    "additionalText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripInsuranceStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripParticipant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "groupId" TEXT,
    "wristNumber" TEXT,
    "houseNumber" TEXT,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "organizerGroupId" TEXT,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "files" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEvent" (
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "interestedIn" BOOLEAN NOT NULL DEFAULT false,
    "enlistedIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEvent_pkey" PRIMARY KEY ("userId","eventId")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "organizerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupJoinRequest" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "submissionType" "SubmissionType" NOT NULL,
    "scoringCategory" "ScoringCategory" NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "dailyStartTime" TEXT,
    "dailyEndTime" TEXT,
    "basePoints" INTEGER NOT NULL DEFAULT 0,
    "firstPlacePoints" INTEGER,
    "secondPlacePoints" INTEGER,
    "thirdPlacePoints" INTEGER,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'HIDDEN',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "votingStartTime" TIMESTAMP(3),
    "votingEndTime" TIMESTAMP(3),
    "targetLatitude" DOUBLE PRECISION,
    "targetLongitude" DOUBLE PRECISION,
    "expectedValue" TEXT,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeSubmission" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "imageIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videoId" TEXT,
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

-- CreateTable
CREATE TABLE "CoinTransaction" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "CoinTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSchedule" (
    "id" TEXT NOT NULL,
    "tripId" TEXT,
    "name" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "notificationTitle" TEXT,
    "notificationBody" TEXT,
    "notificationUrl" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "hour" INTEGER NOT NULL,
    "minute" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRun" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "NotificationSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "tripId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationScheduleExecution" (
    "notificationId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationScheduleExecution_pkey" PRIMARY KEY ("notificationId","scheduleId","executedAt")
);

-- CreateTable
CREATE TABLE "NotificationPush" (
    "targetUserId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "failureReason" TEXT,

    CONSTRAINT "NotificationPush_pkey" PRIMARY KEY ("targetUserId","notificationId")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "tripId" TEXT,
    "notificationId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "deliveryStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryCompletedAt" TIMESTAMP(3),
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isSharingLocation" BOOLEAN NOT NULL DEFAULT false,
    "accuracy" DOUBLE PRECISION,
    "altitude" DOUBLE PRECISION,
    "altitudeAccuracy" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "lastInactivityNotification" TIMESTAMP(3),

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationSharingRequest" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "LocationSharingRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationSharingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "availableQuantity" INTEGER NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "coinCost" INTEGER NOT NULL,
    "tripId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardPurchase" (
    "id" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalCost" INTEGER NOT NULL,
    "status" "RewardPurchaseStatus" NOT NULL DEFAULT 'BOUGHT',
    "collectionMethod" TEXT,
    "purchasedById" TEXT NOT NULL,
    "statusUpdatedById" TEXT,
    "statusUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardPurchase_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logoPath" TEXT NOT NULL,
    "height" INTEGER,
    "offsetX" INTEGER,
    "offsetY" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripSponsor" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripSponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LocationSharingUsers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LocationSharingUsers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_authUserId_key" ON "User"("authUserId");

-- CreateIndex
CREATE INDEX "TripResource_tripId_type_idx" ON "TripResource"("tripId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "TripInsurance_tripId_key" ON "TripInsurance"("tripId");

-- CreateIndex
CREATE INDEX "TripInsuranceStep_insuranceId_stepNumber_idx" ON "TripInsuranceStep"("insuranceId", "stepNumber");

-- CreateIndex
CREATE INDEX "TripParticipant_tripId_groupId_idx" ON "TripParticipant"("tripId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "TripParticipant_userId_tripId_key" ON "TripParticipant"("userId", "tripId");

-- CreateIndex
CREATE UNIQUE INDEX "TripParticipant_tripId_wristNumber_key" ON "TripParticipant"("tripId", "wristNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Group_code_key" ON "Group"("code");

-- CreateIndex
CREATE INDEX "GroupJoinRequest_groupId_createdAt_idx" ON "GroupJoinRequest"("groupId", "createdAt" ASC);

-- CreateIndex
CREATE INDEX "GroupJoinRequest_userId_tripId_idx" ON "GroupJoinRequest"("userId", "tripId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupJoinRequest_tripId_userId_key" ON "GroupJoinRequest"("tripId", "userId");

-- CreateIndex
CREATE INDEX "Challenge_tripId_status_idx" ON "Challenge"("tripId", "status");

-- CreateIndex
CREATE INDEX "Challenge_isRecurring_idx" ON "Challenge"("isRecurring");

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

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDelivery_notificationId_key" ON "NotificationDelivery"("notificationId");

-- CreateIndex
CREATE INDEX "NotificationDelivery_deliveryStartedAt_idx" ON "NotificationDelivery"("deliveryStartedAt");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_idx" ON "NotificationDelivery"("status");

-- CreateIndex
CREATE INDEX "NotificationDelivery_scheduleId_idx" ON "NotificationDelivery"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_userId_token_key" ON "PushSubscription"("userId", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Location_userId_key" ON "Location"("userId");

-- CreateIndex
CREATE INDEX "LocationSharingRequest_receiverId_status_idx" ON "LocationSharingRequest"("receiverId", "status");

-- CreateIndex
CREATE INDEX "LocationSharingRequest_senderId_status_idx" ON "LocationSharingRequest"("senderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LocationSharingRequest_senderId_receiverId_key" ON "LocationSharingRequest"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "Reward_tripId_idx" ON "Reward"("tripId");

-- CreateIndex
CREATE INDEX "RewardPurchase_rewardId_idx" ON "RewardPurchase"("rewardId");

-- CreateIndex
CREATE INDEX "RewardPurchase_groupId_idx" ON "RewardPurchase"("groupId");

-- CreateIndex
CREATE INDEX "RewardPurchase_status_idx" ON "RewardPurchase"("status");

-- CreateIndex
CREATE INDEX "RewardPurchase_statusUpdatedById_idx" ON "RewardPurchase"("statusUpdatedById");

-- CreateIndex
CREATE INDEX "UserAgent_timestamp_idx" ON "UserAgent"("timestamp");

-- CreateIndex
CREATE INDEX "UserAgent_platform_idx" ON "UserAgent"("platform");

-- CreateIndex
CREATE INDEX "UserAgent_userId_idx" ON "UserAgent"("userId");

-- CreateIndex
CREATE INDEX "UserAgent_userAgent_idx" ON "UserAgent"("userAgent");

-- CreateIndex
CREATE INDEX "Sponsor_isActive_idx" ON "Sponsor"("isActive");

-- CreateIndex
CREATE INDEX "Sponsor_createdAt_idx" ON "Sponsor"("createdAt");

-- CreateIndex
CREATE INDEX "TripSponsor_tripId_idx" ON "TripSponsor"("tripId");

-- CreateIndex
CREATE INDEX "TripSponsor_sponsorId_idx" ON "TripSponsor"("sponsorId");

-- CreateIndex
CREATE UNIQUE INDEX "TripSponsor_tripId_sponsorId_key" ON "TripSponsor"("tripId", "sponsorId");

-- CreateIndex
CREATE INDEX "_LocationSharingUsers_B_index" ON "_LocationSharingUsers"("B");

-- AddForeignKey
ALTER TABLE "TripResource" ADD CONSTRAINT "TripResource_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripInsurance" ADD CONSTRAINT "TripInsurance_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripInsuranceStep" ADD CONSTRAINT "TripInsuranceStep_insuranceId_fkey" FOREIGN KEY ("insuranceId") REFERENCES "TripInsurance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripParticipant" ADD CONSTRAINT "TripParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripParticipant" ADD CONSTRAINT "TripParticipant_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripParticipant" ADD CONSTRAINT "TripParticipant_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerGroupId_fkey" FOREIGN KEY ("organizerGroupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEvent" ADD CONSTRAINT "UserEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEvent" ADD CONSTRAINT "UserEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupJoinRequest" ADD CONSTRAINT "GroupJoinRequest_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupJoinRequest" ADD CONSTRAINT "GroupJoinRequest_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupJoinRequest" ADD CONSTRAINT "GroupJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "CoinTransaction" ADD CONSTRAINT "CoinTransaction_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinTransaction" ADD CONSTRAINT "CoinTransaction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSchedule" ADD CONSTRAINT "NotificationSchedule_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSchedule" ADD CONSTRAINT "NotificationSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationScheduleExecution" ADD CONSTRAINT "NotificationScheduleExecution_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationScheduleExecution" ADD CONSTRAINT "NotificationScheduleExecution_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "NotificationSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPush" ADD CONSTRAINT "NotificationPush_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPush" ADD CONSTRAINT "NotificationPush_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationSharingRequest" ADD CONSTRAINT "LocationSharingRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationSharingRequest" ADD CONSTRAINT "LocationSharingRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardPurchase" ADD CONSTRAINT "RewardPurchase_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardPurchase" ADD CONSTRAINT "RewardPurchase_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardPurchase" ADD CONSTRAINT "RewardPurchase_purchasedById_fkey" FOREIGN KEY ("purchasedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardPurchase" ADD CONSTRAINT "RewardPurchase_statusUpdatedById_fkey" FOREIGN KEY ("statusUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripSponsor" ADD CONSTRAINT "TripSponsor_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripSponsor" ADD CONSTRAINT "TripSponsor_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LocationSharingUsers" ADD CONSTRAINT "_LocationSharingUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LocationSharingUsers" ADD CONSTRAINT "_LocationSharingUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================
-- CUSTOM SQL (manually added from previous migrations)
-- These functions, triggers, and cron jobs are critical for
-- application functionality and were not generated by
-- prisma migrate diff.
-- ============================================================

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- CreateFunction: sp_clean_job_details
CREATE OR REPLACE FUNCTION sp_clean_job_details(
  retention_days INTEGER DEFAULT 7
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cron.job_run_details
  WHERE 
    status = 'succeeded'
    AND start_time < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- CreateFunction: sp_process_notification_schedules
CREATE OR REPLACE FUNCTION sp_process_notification_schedules()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  schedule_record RECORD;
  new_notification_id TEXT;
  notification_title TEXT;
  notification_body TEXT;
  notification_url TEXT;
BEGIN
  FOR schedule_record IN
    SELECT * FROM public."NotificationSchedule"
    WHERE "isActive" = true
      AND CURRENT_TIMESTAMP >= "startDate"
      AND CURRENT_TIMESTAMP <= "endDate"
      AND EXTRACT(HOUR FROM CURRENT_TIMESTAMP) = "hour"
      AND EXTRACT(MINUTE FROM CURRENT_TIMESTAMP) = "minute"
      AND (
        "lastRun" IS NULL
        OR "lastRun" < DATE_TRUNC('minute', CURRENT_TIMESTAMP)
      )
  LOOP
    IF schedule_record."notificationType" = 'custom' THEN
      notification_title := COALESCE(
        schedule_record."notificationTitle",
        schedule_record."name"
      );
      notification_body := COALESCE(
        schedule_record."notificationBody",
        'Custom scheduled notification'
      );
      notification_url := COALESCE(schedule_record."notificationUrl", '');
    ELSIF schedule_record."notificationType" = 'ranking' THEN
      notification_title := COALESCE(
        schedule_record."notificationTitle",
        'Daily Ranking Update'
      );
      notification_body := COALESCE(
        schedule_record."notificationBody",
        'Check out today''s rankings!'
      );
      notification_url := COALESCE(schedule_record."notificationUrl", '/ranking');
    ELSE
      notification_title := schedule_record."name";
      notification_body := COALESCE(
        schedule_record."notificationBody",
        'Scheduled notification: ' || schedule_record."notificationType"
      );
      notification_url := COALESCE(schedule_record."notificationUrl", '');
    END IF;

    INSERT INTO public."Notification" (
      "id",
      "tripId",
      "title",
      "body",
      "url",
      "createdById",
      "createdAt",
      "updatedAt"
    ) VALUES (
      gen_random_uuid()::text,
      schedule_record."tripId",
      notification_title,
      notification_body,
      notification_url,
      schedule_record."createdById",
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    ) RETURNING "id" INTO new_notification_id;

    INSERT INTO public."NotificationScheduleExecution" (
      "notificationId",
      "scheduleId",
      "executedAt"
    ) VALUES (
      new_notification_id,
      schedule_record."id",
      CURRENT_TIMESTAMP
    );

    UPDATE public."NotificationSchedule"
    SET "lastRun" = CURRENT_TIMESTAMP
    WHERE "id" = schedule_record."id";
  END LOOP;
END;
$$;

-- CreateFunction: handle_auth_user_created
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  first_name text;
  last_name text;
  role_value "Role";
BEGIN
  first_name := NEW.raw_user_meta_data->>'firstName';
  last_name := NEW.raw_user_meta_data->>'lastName';
  role_value := CASE lower(COALESCE(NEW.raw_app_meta_data->>'role', 'user'))
    WHEN 'admin' THEN 'ADMIN'
    WHEN 'moderator' THEN 'MODERATOR'
    WHEN 'service' THEN 'SERVICE'
    ELSE 'USER'
  END;

  IF first_name IS NULL OR first_name = '' OR last_name IS NULL OR last_name = '' OR role_value IS NULL THEN
    RAISE EXCEPTION 'Missing required user metadata: firstName, lastName, or role';
  END IF;

  INSERT INTO public."User" ("id", "authUserId", "firstName", "lastName", "role", "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid()::text,
    NEW.id::text,
    first_name,
    last_name,
    role_value,
    now(),
    now()
  )
  ON CONFLICT ("authUserId") DO NOTHING;

  RETURN NEW;
END;
$$;

-- CreateFunction: handle_auth_user_deleted
CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  DELETE FROM public."User" WHERE "authUserId" = OLD.id::text;
  RETURN OLD;
END;
$$;

-- CreateCronJob: process notification schedules (every minute)
DO $$
BEGIN
  IF current_database() = 'postgres' THEN
    PERFORM cron.schedule(
      'cron_process-notification-schedules',
      '* * * * *',
      $cron$SELECT sp_process_notification_schedules();$cron$
    );
  END IF;
END;
$$;

-- CreateCronJob: cleanup cron logs (daily at 2 AM)
DO $$
BEGIN
  IF current_database() = 'postgres' THEN
    PERFORM cron.schedule(
      'cron_cleanup-job-details',
      '0 2 * * *',
      $cron$SELECT sp_clean_job_details(7);$cron$
    );
  END IF;
END;
$$;

-- CreateTriggers: Supabase auth user sync
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth')
     AND EXISTS (
       SELECT 1
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'auth' AND c.relname = 'users'
     )
  THEN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      BEFORE INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();

    DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
    CREATE TRIGGER on_auth_user_deleted
      AFTER DELETE ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_deleted();
  END IF;
END;
$$;
