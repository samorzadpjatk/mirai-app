import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  real,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { trips } from "./trip";
import { groups } from "./group";

/**
 * SubmissionType enum
 */
export const submissionTypeEnum = pgEnum("SubmissionType", [
  "IMAGE",
  "MULTI_IMAGE",
  "VIDEO",
  "TEXT",
  "IMAGE_LOCATION",
  "LOCATION",
  "QR_CODE",
]);

/**
 * ScoringCategory enum
 */
export const scoringCategoryEnum = pgEnum("ScoringCategory", [
  "SPEED",
  "UNLIMITED",
  "JUDGED_STAFF",
  "PEER_VOTING",
]);

/**
 * ChallengeStatus enum
 */
export const challengeStatusEnum = pgEnum("ChallengeStatus", [
  "HIDDEN",
  "VISIBLE",
  "ACTIVE",
  "VOTING_PHASE",
  "COMPLETED",
  "CANCELLED",
]);

/**
 * SubmissionStatus enum
 */
export const submissionStatusEnum = pgEnum("SubmissionStatus", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

/**
 * Challenges table - matches Prisma Challenge model
 */
export const challenges = pgTable(
  "Challenge",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("tripId")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    image: text("image"),
    submissionType: submissionTypeEnum("submissionType").notNull(),
    scoringCategory: scoringCategoryEnum("scoringCategory").notNull(),
    isRecurring: boolean("isRecurring").notNull().default(false),
    dailyStartTime: varchar("dailyStartTime", { length: 10 }),
    dailyEndTime: varchar("dailyEndTime", { length: 10 }),
    basePoints: integer("basePoints").notNull().default(0),
    firstPlacePoints: integer("firstPlacePoints"),
    secondPlacePoints: integer("secondPlacePoints"),
    thirdPlacePoints: integer("thirdPlacePoints"),
    status: challengeStatusEnum("status").notNull().default("HIDDEN"),
    startTime: timestamp("startTime", { mode: "date" }),
    endTime: timestamp("endTime", { mode: "date" }),
    votingStartTime: timestamp("votingStartTime", { mode: "date" }),
    votingEndTime: timestamp("votingEndTime", { mode: "date" }),
    targetLatitude: real("targetLatitude"),
    targetLongitude: real("targetLongitude"),
    expectedValue: text("expectedValue"),
    autoApprove: boolean("autoApprove").notNull().default(false),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    // Composite index for cursor pagination on createdAt
    index("challenges_created_at_id_idx").on(table.createdAt, table.id),
  ],
);

export type ChallengeInsert = typeof challenges.$inferInsert;
export type ChallengeSelect = typeof challenges.$inferSelect;

/**
 * Challenge Submissions table
 */
export const challengeSubmissions = pgTable(
  "ChallengeSubmission",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    challengeId: uuid("challengeId")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    groupId: uuid("groupId")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    imageIds: text("imageIds").array().default([]),
    videoId: text("videoId"),
    textContent: text("textContent"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    status: submissionStatusEnum("status").notNull().default("PENDING"),
    reviewedById: uuid("reviewedById"),
    reviewedAt: timestamp("reviewedAt", { mode: "date" }),
    rejectionReason: text("rejectionReason"),
    awardedPoints: integer("awardedPoints").notNull().default(0),
    bonusPoints: integer("bonusPoints").notNull().default(0),
    ranking: integer("ranking"),
    voteCount: integer("voteCount").notNull().default(0),
    voteScore: real("voteScore").notNull().default(0),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    // Composite indexes for cursor pagination
    index("challenge_submissions_created_at_id_idx").on(
      table.createdAt,
      table.id,
    ),
    // Index for vote score sorting (used in peer voting challenges)
    index("challenge_submissions_vote_score_id_idx").on(
      table.voteScore,
      table.id,
    ),
  ],
);

export type ChallengeSubmissionInsert =
  typeof challengeSubmissions.$inferInsert;
export type ChallengeSubmissionSelect =
  typeof challengeSubmissions.$inferSelect;

/**
 * VotePosition enum
 */
export const votePositionEnum = pgEnum("VotePosition", [
  "UPVOTE",
  "DOWNVOTE",
  "NEUTRAL",
]);

/**
 * Challenge Votes table
 */
export const challengeVotes = pgTable(
  "ChallengeVote",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    challengeId: uuid("challengeId")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    submissionId: uuid("submissionId")
      .notNull()
      .references(() => challengeSubmissions.id, { onDelete: "cascade" }),
    voterId: uuid("voterId").notNull(),
    tripParticipantId: uuid("tripParticipantId").notNull(),
    position: votePositionEnum("position").notNull(),
    weight: integer("weight").notNull().default(1),
    isStaffVote: boolean("isStaffVote").notNull().default(false),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    // Composite index for cursor pagination on createdAt
    index("challenge_votes_created_at_id_idx").on(table.createdAt, table.id),
  ],
);

export type ChallengeVoteInsert = typeof challengeVotes.$inferInsert;
export type ChallengeVoteSelect = typeof challengeVotes.$inferSelect;
