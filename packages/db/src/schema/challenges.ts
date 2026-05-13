import {
  pgTable,
  varchar,
  timestamp,
  text,
  integer,
  real,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { randomUUID } from "../utils/uuid";
import { trips } from "./trips";
import { groups } from "./groups";
import { users } from "./users";
import { tripParticipants } from "./trips";
import {
  submissionTypeEnum,
  scoringCategoryEnum,
  challengeStatusEnum,
  submissionStatusEnum,
} from "./enums";

export const challenges = pgTable(
  "challenges",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    tripId: varchar("trip_id", { length: 36 })
      .notNull()
      .references(() => trips.id),
    name: text("name").notNull(),
    description: text("description"),
    image: text("image"),
    submissionType: submissionTypeEnum("submission_type").notNull(),
    scoringCategory: scoringCategoryEnum("scoring_category").notNull(),
    isRecurring: boolean("is_recurring").default(false).notNull(),
    dailyStartTime: text("daily_start_time"),
    dailyEndTime: text("daily_end_time"),
    basePoints: integer("base_points").default(0).notNull(),
    firstPlacePoints: integer("first_place_points"),
    secondPlacePoints: integer("second_place_points"),
    thirdPlacePoints: integer("third_place_points"),
    status: challengeStatusEnum("status").default("HIDDEN").notNull(),
    startTime: timestamp("start_time", { withTimezone: true }),
    endTime: timestamp("end_time", { withTimezone: true }),
    votingStartTime: timestamp("voting_start_time", { withTimezone: true }),
    votingEndTime: timestamp("voting_end_time", { withTimezone: true }),
    targetLatitude: real("target_latitude"),
    targetLongitude: real("target_longitude"),
    expectedValue: text("expected_value"),
    autoApprove: boolean("auto_approve").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("challenges_trip_id_status_idx").on(t.tripId, t.status),
    index("challenges_is_recurring_idx").on(t.isRecurring),
  ],
);

export const challengeSubmissions = pgTable(
  "challenge_submissions",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    challengeId: varchar("challenge_id", { length: 36 })
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    groupId: varchar("group_id", { length: 36 })
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    imageIds: text("image_ids").array().default([]).notNull(),
    videoId: text("video_id"),
    textContent: text("text_content"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    status: submissionStatusEnum("status").default("PENDING").notNull(),
    reviewedById: varchar("reviewed_by_id", { length: 36 }).references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    awardedPoints: integer("awarded_points").default(0).notNull(),
    bonusPoints: integer("bonus_points").default(0).notNull(),
    ranking: integer("ranking"),
    voteCount: integer("vote_count").default(0).notNull(),
    voteScore: real("vote_score").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    uniqueIndex("challenge_submissions_challenge_id_group_id_unique").on(t.challengeId, t.groupId),
    index("challenge_submissions_challenge_id_status_idx").on(t.challengeId, t.status),
    index("challenge_submissions_group_id_idx").on(t.groupId),
  ],
);

export const challengeVotes = pgTable(
  "challenge_votes",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    challengeId: varchar("challenge_id", { length: 36 })
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    submissionId: varchar("submission_id", { length: 36 })
      .notNull()
      .references(() => challengeSubmissions.id, { onDelete: "cascade" }),
    voterId: varchar("voter_id", { length: 36 })
      .notNull()
      .references(() => tripParticipants.id, { onDelete: "cascade" }),
    votePosition: integer("vote_position").notNull(),
    votePoints: integer("vote_points").notNull(),
    normalizedWeight: real("normalized_weight").default(1.0).notNull(),
    votedAt: timestamp("voted_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("challenge_votes_challenge_id_submission_id_voter_id_unique").on(
      t.challengeId,
      t.submissionId,
      t.voterId,
    ),
    index("challenge_votes_challenge_id_idx").on(t.challengeId),
    index("challenge_votes_submission_id_idx").on(t.submissionId),
  ],
);

export const submissionReports = pgTable(
  "submission_reports",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    submissionId: varchar("submission_id", { length: 36 })
      .notNull()
      .references(() => challengeSubmissions.id, { onDelete: "cascade" }),
    reporterId: varchar("reporter_id", { length: 36 })
      .notNull()
      .references(() => tripParticipants.id),
    reason: text("reason").notNull(),
    details: text("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("submission_reports_submission_id_idx").on(t.submissionId)],
);
