-- Rename challenge submission asset columns to store storage IDs instead of public URLs
ALTER TABLE "ChallengeSubmission" RENAME COLUMN "imageUrls" TO "imageIds";
ALTER TABLE "ChallengeSubmission" RENAME COLUMN "videoUrl" TO "videoId";
