import { Effect } from "effect";
import {
  LocationSharingRequest,
  LocationSharingRequestId,
  ValidationError,
  UserId,
} from "@mirai-app/domain";
import { LocationPortTag } from "../ports/LocationPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { UserPortTag } from "../../user/ports/UserPort";
import type { LocationSharingRequestResultDTO } from "../dto/LocationDTOs";
import type { ApplicationError } from "@mirai-app/domain";
import {
  NotTripParticipantError,
  TripHasEndedError,
  CannotShareWithSelfError,
  InvalidSharingTargetError,
  LocationSharingRequestAlreadyExistsError,
  LocationSharingAlreadyEnabledError,
} from "../errors/LocationErrors";

/**
 * Input for RequestLocationSharingUseCase
 */
export interface RequestLocationSharingInput {
  senderId: string;
  receiverId: string;
}

/**
 * Request Location Sharing Use Case
 *
 * Sends a location sharing request to another user.
 */
export class RequestLocationSharingUseCase {
  execute(
    input: RequestLocationSharingInput,
  ) {
    return Effect.gen(function* () {
      const locationPort = yield* LocationPortTag;
      const tripPort = yield* TripPortTag;
      const participantPort = yield* TripParticipantPortTag;
      const userPort = yield* UserPortTag;

      // Check sender is in an active trip
      const senderId = UserId.unsafeCreate(input.senderId);
      const participants = yield* participantPort.findByUserId(senderId);

      if (participants.length === 0) {
        return yield* Effect.fail(
          new NotTripParticipantError({ userId: input.senderId }),
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
            new NotTripParticipantError({ userId: input.senderId }),
          );
        }
        return yield* Effect.fail(
          new TripHasEndedError({ tripId: firstParticipant.tripId }),
        );
      }

      // Check for self-sharing
      if (input.receiverId === input.senderId) {
        return yield* Effect.fail(new CannotShareWithSelfError());
      }

      // Validate receiver is in sharing scope
      const receiverId = UserId.unsafeCreate(input.receiverId);
      let isShareable = false;
      for (const participant of participants) {
        const isTargetParticipant = yield* participantPort.isParticipant(
          receiverId,
          participant.tripId,
        );
        if (isTargetParticipant) {
          isShareable = true;
          break;
        }
      }

      if (!isShareable) {
        return yield* Effect.fail(
          new InvalidSharingTargetError({
            targetUserId: input.receiverId,
            reason: "User is not in your sharing scope",
          }),
        );
      }

      // Check for existing request
      const existingRequest =
        yield* locationPort.findSharingRequestBySenderAndReceiver(
          senderId,
          receiverId,
        );

      if (existingRequest) {
        if (existingRequest.isPending()) {
          return yield* Effect.fail(
            new LocationSharingRequestAlreadyExistsError({
              senderId: input.senderId,
              receiverId: input.receiverId,
            }),
          );
        }

        if (existingRequest.isAccepted()) {
          return yield* Effect.fail(
            new LocationSharingAlreadyEnabledError({
              senderId: input.senderId,
              receiverId: input.receiverId,
            }),
          );
        }

        // Rejected - reset to pending
        const resetEffect = existingRequest.resetToPending();
        const updatedRequest = yield* resetEffect;
        yield* locationPort.updateSharingRequest(updatedRequest);

        // Fetch sender and receiver user details in parallel
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
                  image: sender.hasAvatar
                    ? `/users/${UserId.toString(sender.id)}/avatar`
                    : null,
                }
              : null,
            receiver: receiver
              ? {
                  id: receiver.id,
                  firstName: receiver.firstName,
                  lastName: receiver.lastName,
                  image: receiver.hasAvatar
                    ? `/users/${UserId.toString(receiver.id)}/avatar`
                    : null,
                }
              : null,
            status: updatedRequest.status,
            createdAt: updatedRequest.createdAt,
            updatedAt: updatedRequest.updatedAt,
          },
        };
      }

      // Create new request
      const requestId = LocationSharingRequestId.generate();
      const createEffect = LocationSharingRequest.create({
        id: requestId,
        senderId: senderId,
        receiverId: receiverId,
        status: "PENDING",
      });

      const request = yield* createEffect;
      yield* locationPort.createSharingRequest(request);

      // Fetch sender and receiver user details in parallel
      const [sender, receiver] = yield* Effect.all([
        userPort.findById(request.senderId),
        userPort.findById(request.receiverId),
      ]);

      return {
        success: true,
        request: {
          id: request.id,
          senderId: request.senderId,
          receiverId: request.receiverId,
          sender: sender
            ? {
                id: sender.id,
                firstName: sender.firstName,
                lastName: sender.lastName,
                image: sender.hasAvatar
                  ? `/users/${UserId.toString(sender.id)}/avatar`
                  : null,
              }
            : null,
          receiver: receiver
            ? {
                id: receiver.id,
                firstName: receiver.firstName,
                lastName: receiver.lastName,
                image: receiver.hasAvatar
                  ? `/users/${UserId.toString(receiver.id)}/avatar`
                  : null,
              }
            : null,
          status: request.status,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
        },
      };
    });
  }
}
