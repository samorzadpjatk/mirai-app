import { Effect, Data } from "effect";
import { UserId } from "@mirai-app/domain";
import { LocationPortTag } from "../ports/LocationPort";
import { UserPortTag } from "../../user/ports/UserPort";
import type { MyLocationSharingRequestsDTO } from "../dto/LocationDTOs";
import type { ApplicationError, User } from "@mirai-app/domain";

/**
 * Error when a user referenced in a sharing request is not found
 */
export class RequestUserNotFoundError extends Data.TaggedError("RequestUserNotFoundError")<{
  userId: string;
}> {}

/**
 * Input for GetMyLocationSharingRequestsUseCase
 */
export interface GetMyLocationSharingRequestsInput {
  userId: string;
}

/**
 * Get My Location Sharing Requests Use Case
 *
 * Retrieves all location sharing requests (sent and received) for the user.
 */
export class GetMyLocationSharingRequestsUseCase {
  execute(
    input: GetMyLocationSharingRequestsInput,
  ) {
    return Effect.gen(function* () {
      const locationPort = yield* LocationPortTag;
      const userPort = yield* UserPortTag;

      const userId = UserId.unsafeCreate(input.userId);

      // Get sent and received requests in parallel
      const [sent, received] = yield* Effect.all([
        locationPort.findSharingRequestsBySender(userId),
        locationPort.findSharingRequestsByReceiver(userId),
      ]);

      // Collect all unique user IDs (both senders and receivers)
      const uniqueUserIds = new Set<string>();
      for (const request of [...sent, ...received]) {
        uniqueUserIds.add(UserId.toString(request.senderId));
        uniqueUserIds.add(UserId.toString(request.receiverId));
      }

      // Fetch all users in parallel
      const userIds = [...uniqueUserIds].map((id) => UserId.unsafeCreate(id));
      const users = yield* Effect.all(
        userIds.map((id) => userPort.findById(id)),
      );

      // Create lookup map for users
      const userMap = new Map<string, User>();
      for (let i = 0; i < userIds.length; i++) {
        const user = users[i];
        const userId = userIds[i];
        if (user && userId) {
          userMap.set(UserId.toString(userId), user);
        }
      }

      // Helper to build user DTO
      const buildUserDTO = (userId: UserId) => {
        const user = userMap.get(UserId.toString(userId));
        if (!user) {
          return null;
        }
        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.hasAvatar ? `/users/${UserId.toString(user.id)}/avatar` : null,
        };
      };

      // Build fully-populated DTOs
      const sentDTOs = sent.map((request) => ({
        id: request.id,
        senderId: request.senderId,
        receiverId: request.receiverId,
        sender: buildUserDTO(request.senderId),
        receiver: buildUserDTO(request.receiverId),
        status: request.status,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      }));

      const receivedDTOs = received.map((request) => ({
        id: request.id,
        senderId: request.senderId,
        receiverId: request.receiverId,
        sender: buildUserDTO(request.senderId),
        receiver: buildUserDTO(request.receiverId),
        status: request.status,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      }));

      return {
        sent: sentDTOs,
        received: receivedDTOs,
      };
    });
  }
}
