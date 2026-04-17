import { Effect, Data } from "effect";
import type {
  ApplicationError,
  Challenge,
  ChallengeId,
  TripId,
} from "@mirai-app/domain";
import { Challenge as ChallengeEntity } from "@mirai-app/domain";
import { ChallengePortTag } from "../ports/ChallengePort";
import {
  ChallengeValidationError,
  InvalidPeerVotingConfigError,
  InvalidRecurringConfigError,
} from "../errors/ChallengeErrors";
import type { ChallengeDTO } from "../dto/ChallengeDTOs";

/**
 * Input for CreateChallengeUseCase
 */
export interface CreateChallengeInput {
  tripId: string;
  name: string;
  description?: string;
  qrCodeValue?: string;
  textExpectedPhrase?: string;
  image?: string;
  submissionType:
    | "IMAGE"
    | "VIDEO"
    | "TEXT"
    | "IMAGE_LOCATION"
    | "LOCATION"
    | "QR_CODE";
  scoringCategory: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING";
  isRecurring?: boolean;
  recurringDays?: number;
  dailyStartTime?: string;
  dailyEndTime?: string;
  basePoints?: number;
  firstPlacePoints?: number;
  secondPlacePoints?: number;
  thirdPlacePoints?: number;
  status?: "HIDDEN" | "VISIBLE";
  startTime?: Date;
  endTime?: Date;
  votingDurationHours?: number;
  votingStartTime?: Date;
  votingEndTime?: Date;
  targetLatitude?: number;
  targetLongitude?: number;
  autoApprove?: boolean;
}

const MAX_RECURRING_DAYS = 30;
const MAX_PEER_VOTING_DURATION_HOURS = 24 * 30;
const HOUR_MS = 60 * 60 * 1000;

/**
 * Create Challenge Use Case
 *
 * Creates a new challenge with validation for peer voting and recurring configurations.
 */
export class CreateChallengeUseCase {
  execute(
    input: CreateChallengeInput,
  ): Effect.Effect<
    ChallengeDTO,
    | ChallengeValidationError
    | InvalidPeerVotingConfigError
    | InvalidRecurringConfigError
    | ApplicationError,
    ChallengePortTag
  > {
    return Effect.gen(function* () {
      const challengePort = yield* ChallengePortTag;
      const now = new Date();

      // Validate peer voting timeline
      if (input.scoringCategory === "PEER_VOTING") {
        if (
          input.submissionType !== "IMAGE" &&
          input.submissionType !== "VIDEO"
        ) {
          return yield* Effect.fail(
            new InvalidPeerVotingConfigError({
              message:
                "Peer voting is supported only for IMAGE or VIDEO challenges",
            }),
          );
        }

        if (!input.endTime) {
          return yield* Effect.fail(
            new InvalidPeerVotingConfigError({
              message: "Peer voting challenge requires submission end time",
            }),
          );
        }

        const hasDuration =
          input.votingDurationHours != null &&
          Number.isInteger(input.votingDurationHours) &&
          input.votingDurationHours > 0;
        const hasWindow =
          Boolean(input.votingStartTime) && Boolean(input.votingEndTime);

        if (!hasDuration && !hasWindow) {
          return yield* Effect.fail(
            new InvalidPeerVotingConfigError({
              message:
                "Peer voting challenge requires voting duration in hours or days",
            }),
          );
        }

        if (
          input.votingDurationHours != null &&
          (input.votingDurationHours < 1 ||
            input.votingDurationHours > MAX_PEER_VOTING_DURATION_HOURS)
        ) {
          return yield* Effect.fail(
            new InvalidPeerVotingConfigError({
              message: `Voting duration must be between 1 and ${MAX_PEER_VOTING_DURATION_HOURS} hours`,
            }),
          );
        }
      }

      // Validate recurring timeline
      if (input.isRecurring) {
        if (input.scoringCategory === "PEER_VOTING") {
          return yield* Effect.fail(
            new InvalidRecurringConfigError({
              message: "Recurring peer voting challenges are not supported",
            }),
          );
        }

        if (!input.dailyStartTime || !input.dailyEndTime) {
          return yield* Effect.fail(
            new InvalidRecurringConfigError({
              message: "Recurring challenge requires daily start and end time",
            }),
          );
        }

        if (
          !input.recurringDays ||
          input.recurringDays < 1 ||
          input.recurringDays > MAX_RECURRING_DAYS
        ) {
          return yield* Effect.fail(
            new InvalidRecurringConfigError({
              message: `Recurring days must be between 1 and ${MAX_RECURRING_DAYS}`,
            }),
          );
        }
      }

      // Validate auto-approve rules
      if (input.submissionType === "IMAGE_LOCATION" && input.autoApprove) {
        return yield* Effect.fail(
          new ChallengeValidationError({
            field: "autoApprove",
            message: "Image + Location challenges cannot use auto-approve",
          }),
        );
      }

      if (
        input.submissionType === "TEXT" &&
        input.autoApprove &&
        !input.textExpectedPhrase?.trim()
      ) {
        return yield* Effect.fail(
          new ChallengeValidationError({
            field: "textExpectedPhrase",
            message:
              "Text auto-approve requires an expected phrase, or disable auto-approve",
          }),
        );
      }

      // Calculate voting window for peer voting
      let votingStartTime: Date | null = null;
      let votingEndTime: Date | null = null;
      if (input.scoringCategory === "PEER_VOTING" && input.endTime) {
        const durationHours = input.votingDurationHours ?? 24;
        votingStartTime =
          input.votingStartTime ?? new Date(input.endTime.getTime());
        votingEndTime =
          input.votingEndTime ??
          new Date(votingStartTime.getTime() + durationHours * HOUR_MS);
      }

      // Determine initial status
      const requestedStatus = input.status ?? "HIDDEN";
      const shouldActivateImmediately =
        !input.isRecurring &&
        requestedStatus === "VISIBLE" &&
        Boolean(input.startTime) &&
        input.startTime! <= now &&
        (!input.endTime || input.endTime > now);
      const initialStatus = shouldActivateImmediately
        ? "ACTIVE"
        : requestedStatus;

      // Calculate expected value
      let expectedValue: string | null = null;
      if (input.submissionType === "QR_CODE") {
        expectedValue = input.qrCodeValue ?? null;
      } else if (input.submissionType === "TEXT") {
        expectedValue = input.textExpectedPhrase ?? null;
      }

      // Calculate auto-approve
      let autoApprove = input.autoApprove ?? false;
      if (
        input.submissionType === "QR_CODE" ||
        input.submissionType === "LOCATION"
      ) {
        autoApprove = true;
      } else if (input.submissionType === "IMAGE_LOCATION") {
        autoApprove = false;
      }

      // Create challenge entity
      const challengeId = yield* Effect.promise(() =>
        Promise.resolve("" as unknown as ChallengeId),
      );
      const tripId = yield* Effect.promise(() =>
        Promise.resolve(input.tripId as unknown as TripId),
      );

      const challengeEffect = ChallengeEntity.create({
        id: challengeId,
        tripId: tripId,
        name: input.name,
        description: input.description ?? null,
        image: input.image ?? null,
        submissionType: input.submissionType,
        scoringCategory: input.scoringCategory,
        isRecurring: input.isRecurring ?? false,
        dailyStartTime: input.dailyStartTime ?? null,
        dailyEndTime: input.dailyEndTime ?? null,
        basePoints: input.basePoints ?? 0,
        firstPlacePoints: input.firstPlacePoints ?? null,
        secondPlacePoints: input.secondPlacePoints ?? null,
        thirdPlacePoints: input.thirdPlacePoints ?? null,
        status: initialStatus,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        votingStartTime,
        votingEndTime,
        targetLatitude: input.targetLatitude ?? null,
        targetLongitude: input.targetLongitude ?? null,
        expectedValue,
        autoApprove,
        createdAt: now,
        updatedAt: now,
      });

      const challenge = yield* challengeEffect;

      // Save challenge
      const saved = yield* challengePort.create(challenge);

      // Map to DTO
      return {
        id: saved.id,
        tripId: saved.tripId,
        name: saved.name,
        description: saved.description,
        image: saved.image,
        submissionType: saved.submissionType,
        scoringCategory: saved.scoringCategory,
        isRecurring: saved.isRecurring,
        dailyStartTime: saved.dailyStartTime,
        dailyEndTime: saved.dailyEndTime,
        basePoints: saved.basePoints,
        firstPlacePoints: saved.firstPlacePoints,
        secondPlacePoints: saved.secondPlacePoints,
        thirdPlacePoints: saved.thirdPlacePoints,
        status: saved.status,
        startTime: saved.startTime,
        endTime: saved.endTime,
        votingStartTime: saved.votingStartTime,
        votingEndTime: saved.votingEndTime,
        targetLatitude: saved.targetLatitude,
        targetLongitude: saved.targetLongitude,
        expectedValue: saved.expectedValue,
        autoApprove: saved.autoApprove,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      };
    });
  }
}
