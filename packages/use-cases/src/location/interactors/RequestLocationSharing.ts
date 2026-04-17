import { Effect } from "effect";
import {
  LocationSharingRequest,
  LocationSharingRequestId,
  ValidationError,
} from "@mirai-app/domain";
import { UserId } from "@mirai-app/domain";
import { LocationPort } from "../ports/LocationPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
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
  ): Effect.Effect<
    LocationSharingRequestResultDTO,
    | ApplicationError
    | NotTripParticipantError
    | TripHasEndedError
    | CannotShareWithSelfError
    | InvalidSharingTargetError
    | LocationSharingRequestAlreadyExistsError
    | LocationSharingAlreadyEnabledError
    | ValidationError,
    LocationPort | TripPortTag | TripParticipantPort
  > {
    return Effect.gen(function* () {
      const locationPort = yield* LocationPort;
      const tripPort = yield* TripPortTag;
      const participantPort = yield* TripParticipantPort;

      // Check sender is in an active trip
      const participants = yield* participantPort.findByUserId(input.senderId);

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
      let isShareable = false;
      for (const participant of participants) {
        const isTargetParticipant = yield* participantPort.isParticipant(
          input.receiverId,
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
      const senderId = UserId.unsafeCreate(input.senderId);
      const receiverId = UserId.unsafeCreate(input.receiverId);

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

      return {
        success: true,
        request: {
          id: request.id,
          senderId: request.senderId,
          receiverId: request.receiverId,
          sender: null, // Will be hydrated by adapter
          receiver: null,
          status: request.status,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
        },
      };
    });
  }
}
