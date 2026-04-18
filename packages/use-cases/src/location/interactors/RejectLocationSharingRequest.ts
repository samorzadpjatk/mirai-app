import { Effect } from "effect";
import { LocationSharingRequestId, ValidationError } from "@mirai-app/domain";
import { UserId } from "@mirai-app/domain";
import { LocationPortTag } from "../ports/LocationPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { UserPortTag } from "../../user/ports/UserPort";
import {
  NotTripParticipantError,
  TripHasEndedError,
  LocationSharingRequestNotFoundError,
  NotRequestRecipientError,
  RequestNotPendingError,
} from "../errors/LocationErrors";

/**
 * Input for RejectLocationSharingRequestUseCase
 */
export interface RejectLocationSharingRequestInput {
  userId: string;
  requestId: string;
}

/**
 * Reject Location Sharing Request Use Case
 *
 * Rejects a pending location sharing request.
 */
export class RejectLocationSharingRequestUseCase {
  execute(input: RejectLocationSharingRequestInput) {
    return Effect.gen(function* () {
      const locationPort = yield* LocationPortTag;
      const tripPort = yield* TripPortTag;
      const participantPort = yield* TripParticipantPortTag;

      const userId = UserId.unsafeCreate(input.userId);

      // Check user is in an active trip
      const participants = yield* participantPort.findByUserId(userId);

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
      if (!UserId.equals(request.receiverId, userId)) {
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

      // Reject the request
      const rejectEffect = request.reject();
      const updatedRequest = yield* rejectEffect;
      yield* locationPort.updateSharingRequest(updatedRequest);

      // Fetch sender and receiver user data in parallel
      const userPort = yield* UserPortTag;
      const [sender, receiver] = yield* Effect.all([
        userPort.findById(updatedRequest.senderId),
        userPort.findById(updatedRequest.receiverId),
      ]);

      return {
        success: true,
        request: {
          id: updatedRequest.id,
          senderId: updatedRequest.senderId,
          receiverId: updatedRequest.receiverId,
          sender: sender
            ? {
                id: sender.id,
                firstName: sender.firstName,
                lastName: sender.lastName,
                hasAvatar: sender.hasAvatar,
              }
            : null,
          receiver: receiver
            ? {
                id: receiver.id,
                firstName: receiver.firstName,
                lastName: receiver.lastName,
                hasAvatar: receiver.hasAvatar,
              }
            : null,
          status: updatedRequest.status,
          createdAt: updatedRequest.createdAt,
          updatedAt: updatedRequest.updatedAt,
        },
      };
    });
  }
}
