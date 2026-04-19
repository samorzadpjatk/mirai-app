import { Effect, Data } from "effect";
import type { ApplicationError, ChallengeSubmissionId, UserId, TripId } from "@mirai-app/domain";
import { ChallengeId, GroupId, ChallengeSubmissionId as ChallengeSubmissionIdFactory, UserId as UserIdFactory, TripId as TripIdFactory, ImageId, VideoId } from "@mirai-app/domain";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
import {
  ChallengeSubmissionPort,
  type ChallengeSubmission,
} from "../ports/ChallengeSubmissionPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import { GroupPort } from "../../group/ports/GroupPort";
import { CoinTransactionPort } from "../../coin/ports/CoinTransactionPort";
import { ActivityFeedPort } from "../../activity-feed/ports/ActivityFeedPort";
import { ChallengeNotFoundError } from "../../challenge/errors/ChallengeErrors";
import {
  ChallengeNotActiveError,
  SubmissionWindowClosedError,
  SubmissionAlreadyExistsError,
  NotGroupMemberError,
  MissingRequiredMediaError,
  InvalidLocationError,
  InvalidQrCodeError,
  InvalidTextPhraseError,
} from "../errors/SubmissionErrors";
import type { CreateSubmissionResultDTO } from "../dto/ChallengeSubmissionDTOs";

/**
 * Input for CreateSubmissionUseCase
 */
export interface CreateSubmissionInput {
  tripId: string;
  challengeId: string;
  userId: string;
  imageIds?: string[];
  videoId?: string;
  textContent?: string;
  latitude?: number;
  longitude?: number;
}

const LOCATION_SUBMISSION_RADIUS_METERS = 200;

/**
 * Create Submission Use Case
 *
 * Creates a new submission for a challenge with validation.
 */
export class CreateSubmissionUseCase {
  execute(input: CreateSubmissionInput) {
    return Effect.gen(function* () {
      const challengePort = yield* ChallengePortTag;
      const submissionPort = yield* ChallengeSubmissionPort;
      const participantPort = yield* TripParticipantPort;
      const groupPort = yield* GroupPort;

      // Get participant info
      const participant = yield* participantPort.findByUserAndTrip(
        UserIdFactory.create(input.userId),
        TripIdFactory.create(input.tripId),
      );

      if (!participant) {
        return yield* Effect.fail(
          new NotGroupMemberError({
            userId: input.userId,
            tripId: input.tripId,
          }),
        );
      }

      if (!participant.groupId) {
        return yield* Effect.fail(
          new NotGroupMemberError({
            userId: input.userId,
            tripId: input.tripId,
          }),
        );
      }

      // Verify challenge exists and is active
      const challenge = yield* challengePort.findById(ChallengeId.create(input.challengeId));
      if (!challenge) {
        return yield* Effect.fail(
          new ChallengeNotFoundError({ challengeId: input.challengeId }),
        );
      }

      if (challenge.status !== "ACTIVE") {
        return yield* Effect.fail(
          new ChallengeNotActiveError({
            challengeId: input.challengeId,
            currentStatus: challenge.status,
          }),
        );
      }

      if (challenge.endTime && challenge.endTime <= new Date()) {
        return yield* Effect.fail(
          new SubmissionWindowClosedError({
            challengeId: input.challengeId,
            endTime: challenge.endTime,
          }),
        );
      }

      // Check for existing submission
      const existingSubmission = yield* submissionPort.findByChallengeAndGroup(
        ChallengeId.create(input.challengeId),
        GroupId.create(participant.groupId),
      );

      if (existingSubmission) {
        return yield* Effect.fail(
          new SubmissionAlreadyExistsError({
            challengeId: input.challengeId,
            groupId: participant.groupId,
          }),
        );
      }

      // Validate submission payload based on type
      yield* validateSubmissionPayload(input, challenge);

      // Check auto-approve conditions
      const autoApproved = shouldAutoApprove(input, challenge);

      // Create submission
      const now = new Date();
      const submission: ChallengeSubmission = {
        id: ChallengeSubmissionIdFactory.create(ChallengeSubmissionIdFactory.generate()),
        challengeId: ChallengeId.create(input.challengeId),
        groupId: GroupId.create(participant.groupId),
        imageIds: (input.imageIds ?? []).map((id) => ImageId.unsafeCreate(id)),
        videoId: input.videoId ? VideoId.unsafeCreate(input.videoId) : null,
        textContent: input.textContent ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        status: autoApproved ? "APPROVED" : "PENDING",
        reviewedById: autoApproved ? UserIdFactory.create(UserIdFactory.generate()) : null,
        reviewedAt: autoApproved ? now : null,
        rejectionReason: null,
        awardedPoints: autoApproved ? challenge.basePoints : null,
        bonusPoints: null,
        ranking: null,
        voteCount: 0,
        voteScore: 0,
        createdAt: now,
        updatedAt: now,
      };

      // Save submission
      const saved = yield* submissionPort.create(submission);

      // Award points if auto-approved
      if (autoApproved && saved.awardedPoints && saved.awardedPoints > 0) {
        yield* groupPort.addCoins(participant.groupId, saved.awardedPoints);
      }

      return {
        id: saved.id,
        challengeId: saved.challengeId,
        groupId: saved.groupId,
        status: saved.status,
        createdAt: saved.createdAt,
      };
    });
  }
}

function validateSubmissionPayload(
  input: CreateSubmissionInput,
  challenge: { submissionType: string },
): Effect.Effect<void, MissingRequiredMediaError, never> {
  const imageCount = input.imageIds?.length ?? 0;
  const hasText = Boolean(input.textContent?.trim());
  const hasVideo = Boolean(input.videoId);
  const hasLocation =
    typeof input.latitude === "number" && typeof input.longitude === "number";

  switch (challenge.submissionType) {
    case "IMAGE":
      if (imageCount < 1) {
        return Effect.fail(
          new MissingRequiredMediaError({
            submissionType: "IMAGE",
            required: "at least 1 image",
          }),
        );
      }
      break;
    case "MULTI_IMAGE":
      if (imageCount < 2) {
        return Effect.fail(
          new MissingRequiredMediaError({
            submissionType: "MULTI_IMAGE",
            required: "at least 2 images",
          }),
        );
      }
      break;
    case "VIDEO":
      if (!hasVideo) {
        return Effect.fail(
          new MissingRequiredMediaError({
            submissionType: "VIDEO",
            required: "video",
          }),
        );
      }
      break;
    case "TEXT":
      if (!hasText) {
        return Effect.fail(
          new MissingRequiredMediaError({
            submissionType: "TEXT",
            required: "text content",
          }),
        );
      }
      break;
    case "IMAGE_LOCATION":
      if (imageCount < 1 || !hasLocation) {
        return Effect.fail(
          new MissingRequiredMediaError({
            submissionType: "IMAGE_LOCATION",
            required: "image and location",
          }),
        );
      }
      break;
    case "LOCATION":
      if (!hasLocation) {
        return Effect.fail(
          new MissingRequiredMediaError({
            submissionType: "LOCATION",
            required: "location",
          }),
        );
      }
      break;
    case "QR_CODE":
      if (!hasText && imageCount < 1) {
        return Effect.fail(
          new MissingRequiredMediaError({
            submissionType: "QR_CODE",
            required: "QR code (text or image)",
          }),
        );
      }
      break;
  }

  return Effect.succeed(void 0);
}

function shouldAutoApprove(
  input: CreateSubmissionInput,
  challenge: {
    submissionType: string;
    autoApprove: boolean;
    expectedValue: string | null;
    targetLatitude: number | null;
    targetLongitude: number | null;
  },
): boolean {
  if (challenge.submissionType === "QR_CODE") {
    const expected = challenge.expectedValue?.trim();
    const submitted = input.textContent?.trim();
    return expected === submitted;
  }

  if (
    challenge.submissionType === "LOCATION" ||
    challenge.submissionType === "IMAGE_LOCATION"
  ) {
    if (
      typeof input.latitude !== "number" ||
      typeof input.longitude !== "number" ||
      typeof challenge.targetLatitude !== "number" ||
      typeof challenge.targetLongitude !== "number"
    ) {
      return false;
    }

    const distance = calculateDistance(
      input.latitude,
      input.longitude,
      challenge.targetLatitude,
      challenge.targetLongitude,
    );

    return distance * 1000 <= LOCATION_SUBMISSION_RADIUS_METERS;
  }

  if (challenge.submissionType === "TEXT") {
    const expected = challenge.expectedValue?.trim();
    if (expected) {
      const submitted = input.textContent?.trim();
      return expected === submitted;
    }
  }

  return challenge.autoApprove;
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
