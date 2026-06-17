-- =============================================================================
-- Cleanup: Drop legacy Prisma CamelCase tables
-- =============================================================================
-- Context: After confirming all data migrated successfully to snake_case tables,
-- run this migration to remove the old backup tables.
-- =============================================================================

DROP TABLE IF EXISTS "User", "Trip", "Group", "TripParticipant", "Event",
	"UserEvent", "GroupJoinRequest", "Challenge", "ChallengeSubmission",
	"ChallengeVote", "SubmissionReport", "ActivityFeed", "ActivityReaction",
	"ChallengeActivity", "RankChangeActivity", "SubmissionActivity",
	"UserPost", "Location", "LocationSharingRequest", "LocationShare",
	"Notification", "NotificationSchedule", "NotificationScheduleExecution",
	"NotificationPush", "NotificationDelivery", "PushSubscription",
	"Reward", "RewardPurchase", "CoinTransaction", "Sponsor",
	"TripSponsor", "TripResource", "TripInsurance", "TripInsuranceStep",
	"UserAgent" CASCADE;--> statement-breakpoint