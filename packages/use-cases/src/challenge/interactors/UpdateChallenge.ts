import { Effect, Data } from "effect";
import type { ApplicationError } from "@mirai-app/domain";
import { ChallengePortTag } from "../ports/ChallengePort";
import { ChallengeSubmissionPort } from "../../challenge-submission/ports/ChallengeSubmissionPort";
import {
  ChallengeNotFoundError,
  InvalidPeerVotingConfigError,
  PeerVotingNotReadyError,
  NotPeerVotingChallengeError,
} from "../errors/ChallengeErrors";
import type { ChallengeDTO } from "../dto/ChallengeDTOs";

/**
 * Input for UpdateChallengeUseCase
 */
export interface UpdateChallengeInput {
  challengeId: string;
  tripId: string;
  name?: string;
  description?: string;
  qrCodeValue?: string;
  textExpectedPhrase?: string;
  image?: string;
  submissionType?:
    | "IMAGE"
    | "VIDEO"
    | "TEXT"
    | "IMAGE_LOCATION"
    | "LOCATION"
    | "QR_CODE";
  scoringCategory?: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING";
  isRecurring?: boolean;
  recurringDays?: number;
  dailyStartTime?: string;
  dailyEndTime?: string;
  basePoints?: number;
  firstPlacePoints?: number;
  secondPlacePoints?: number;
  thirdPlacePoints?: number;
  status?:
    | "HIDDEN"
    | "VISIBLE"
    | "ACTIVE"
    | "VOTING_PHASE"
    | "COMPLETED"
    | "CANCELLED";
  startTime?: Date;
  endTime?: Date;
  votingDurationHours?: number;
  votingStartTime?: Date;
  votingEndTime?: Date;
  targetLatitude?: number;
  targetLongitude?: number;
  autoApprove?: boolean;
}

const MAX_PEER_VOTING_DURATION_HOURS = 24 * 30;
const HOUR_MS = 60 * 60 * 1000;

/**
 * Update Challenge Use Case
 *
 * Updates an existing challenge with validation.
 */
export class UpdateChallengeUseCase {
  execute(
    input: UpdateChallengeInput,
  ): Effect.Effect<
    ChallengeDTO,
    | ChallengeNotFoundError
    | InvalidPeerVotingConfigError
    | PeerVotingNotReadyError
    | NotPeerVotingChallengeError
    | ApplicationError,
    ChallengePortTag | ChallengeSubmissionPort
  > {
    return Effect.gen(function* () {
      const challengePort = yield* ChallengePortTag;
      const submissionPort = yield* ChallengeSubmissionPort;

      // Find existing challenge
      const existing = yield* challengePort.findById(input.challengeId);
      if (!existing) {
        return yield* Effect.fail(
          new ChallengeNotFoundError({ challengeId: input.challengeId }),
        );
      }

      // Validate peer voting transition
      const nextStatus = input.status ?? existing.status;
      const nextScoringCategory =
        input.scoringCategory ?? existing.scoringCategory;

      if (
        nextScoringCategory === "PEER_VOTING" &&
        existing.status !== "VOTING_PHASE" &&
        nextStatus === "VOTING_PHASE"
      ) {
        const [totalSubmissions, pendingSubmissions] = yield* Effect.all([
          submissionPort.countByChallengeId(input.challengeId),
          submissionPort.countPendingByChallengeId(input.challengeId),
        ]);

        if (totalSubmissions === 0 || pendingSubmissions > 0) {
          return yield* Effect.fail(
            new PeerVotingNotReadyError({
              challengeId: input.challengeId,
              totalSubmissions,
              pendingSubmissions,
            }),
          );
        }
      }

      // Update challenge entity
      let updated = existing;

      if (
        input.name ||
        input.description !== undefined ||
        input.image !== undefined
      ) {
        const detailsEffect = existing.withDetails({
          name: input.name,
          description: input.description,
          image: input.image,
        });
        updated = yield* detailsEffect;
      }

      if (input.status && input.status !== existing.status) {
        updated = updated.withStatus(input.status);
      }

      // Save updated challenge
      const saved = yield* challengePort.update(updated);

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
