import { Effect } from "effect";
import { LocationSharingRequestId, ValidationError } from "@mirai-app/domain";
import { UserId } from "@mirai-app/domain";
import { LocationPort } from "../ports/LocationPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import type { RequestResponseResultDTO } from "../dto/LocationDTOs";
import type { ApplicationError } from "@mirai-app/domain";
import {
  NotTripParticipantError,
  TripHasEndedError,
  LocationSharingRequestNotFoundError,
  NotRequestRecipientError,
  RequestNotPendingError,
} from "../errors/LocationErrors";

/**
 * Input for AcceptLocationSharingRequestUseCase
 */
export interface AcceptLocationSharingRequestInput {
  userId: string;
  requestId: string;
}

/**
 * Accept Location Sharing Request Use Case
 *
 * Accepts a pending location sharing request.
 */
export class AcceptLocationSharingRequestUseCase {
  execute(
    input: AcceptLocationSharingRequestInput,
  ): Effect.Effect<
    RequestResponseResultDTO,
    | ApplicationError
    | NotTripParticipantError
    | TripHasEndedError
    | LocationSharingRequestNotFoundError
    | NotRequestRecipientError
    | RequestNotPendingError
    | ValidationError,
    LocationPort | TripPortTag | TripParticipantPort
  > {
    return Effect.gen(function* () {
      const locationPort = yield* LocationPort;
      const tripPort = yield* TripPortTag;
      const participantPort = yield* TripParticipantPort;

      // Check user is in an active trip
      const participants = yield* participantPort.findByUserId(input.userId);

      if (participants.length === 0) {
        return yield* Effect.fail(
          new NotTripParticipantError({ userId: input.userId }),
        );
      }

      let hasActiveTrip = false;
      const now = new Date();

      for (const participant of participants) {
        const trip = yield* tripPort.findById(participant.tripId);
        if (trip && !trip.hasEnded(now)) {
          hasActiveTrip = true;
          break;
        }
      }

      if (!hasActiveTrip) {
        const firstParticipant = participants[0];
        if (firstParticipant === undefined) {
          return yield* Effect.fail(
            new NotTripParticipantError({ userId: input.userId }),
          );
        }
        return yield* Effect.fail(
          new TripHasEndedError({ tripId: firstParticipant.tripId }),
        );
      }

      // Find the request
      const requestId = LocationSharingRequestId.unsafeCreate(input.requestId);
      const request = yield* locationPort.findSharingRequestById(requestId);

      if (!request) {
        return yield* Effect.fail(
          new LocationSharingRequestNotFoundError({
            requestId: input.requestId,
          }),
        );
      }

      // Verify user is the receiver
      const userId = UserId.unsafeCreate(input.userId);
      if (request.receiverId !== userId) {
        return yield* Effect.fail(
          new NotRequestRecipientError({
            requestId: input.requestId,
            userId: input.userId,
          }),
        );
      }

      // Check request is pending
      if (!request.isPending()) {
        return yield* Effect.fail(
          new RequestNotPendingError({
            requestId: input.requestId,
            currentStatus: request.status,
          }),
        );
      }

      // Accept the request
      const acceptEffect = request.accept();
      const updatedRequest = yield* acceptEffect;
      yield* locationPort.updateSharingRequest(updatedRequest);

      // Add both users to each other's sharing lists
      yield* locationPort.connectUserToSharing(
        request.senderId,
        request.receiverId,
      );
      yield* locationPort.connectUserToSharing(
        request.receiverId,
        request.senderId,
      );

      return {
        success: true,
        request: {
          id: updatedRequest.id,
          senderId: updatedRequest.senderId,
          receiverId: updatedRequest.receiverId,
          sender: null, // Will be hydrated by adapter
          receiver: null,
          status: updatedRequest.status,
          createdAt: updatedRequest.createdAt,
          updatedAt: updatedRequest.updatedAt,
        },
      };
    });
  }
}
