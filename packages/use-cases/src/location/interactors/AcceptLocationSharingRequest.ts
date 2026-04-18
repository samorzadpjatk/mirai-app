import { Effect } from "effect";
import { LocationSharingRequestId, ValidationError } from "@mirai-app/domain";
import { UserId } from "@mirai-app/domain";
import { LocationPortTag } from "../ports/LocationPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { UserPortTag } from "../../user/ports/UserPort";
import { StoragePortTag } from "../../storage/ports/StoragePort";
import type { RequestResponseResultDTO } from "../dto/LocationDTOs";
import {
  NotTripParticipantError,
  TripHasEndedError,
  LocationSharingRequestNotFoundError,
  NotRequestRecipientError,
  RequestNotPendingError,
} from "../errors/LocationErrors";
import { UserNotFoundError } from "../../user/errors/UserErrors";

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
  execute(input: AcceptLocationSharingRequestInput) {
    return Effect.gen(function* () {
      const locationPort = yield* LocationPortTag;
      const tripPort = yield* TripPortTag;
      const participantPort = yield* TripParticipantPortTag;
      const storagePort = yield* StoragePortTag;

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

      // Fetch sender and receiver user data in parallel
      const userPort = yield* UserPortTag;
      const [sender, receiver] = yield* Effect.all([
        userPort.findById(request.senderId),
        userPort.findById(request.receiverId),
      ]);

      // Handle missing users gracefully
      if (!sender) {
        return yield* Effect.fail(
          new UserNotFoundError({ userId: UserId.toString(request.senderId) }),
        );
      }

      if (!receiver) {
        return yield* Effect.fail(
          new UserNotFoundError({ userId: UserId.toString(request.receiverId) }),
        );
      }

      return {
        success: true,
        request: {
          id: updatedRequest.id,
          senderId: updatedRequest.senderId,
          receiverId: updatedRequest.receiverId,
          sender: {
            id: sender.id,
            firstName: sender.firstName,
            lastName: sender.lastName,
            image: sender.hasAvatar
              ? storagePort.getPublicUrl(
                  "images",
                  `avatars/${UserId.toString(sender.id)}.jpg`,
                )
              : null,
          },
          receiver: {
            id: receiver.id,
            firstName: receiver.firstName,
            lastName: receiver.lastName,
            image: receiver.hasAvatar
              ? storagePort.getPublicUrl(
                  "images",
                  `avatars/${UserId.toString(receiver.id)}.jpg`,
                )
              : null,
          },
          status: updatedRequest.status,
          createdAt: updatedRequest.createdAt,
          updatedAt: updatedRequest.updatedAt,
        },
      };
    });
  }
}
