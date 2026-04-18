import { Effect } from "effect";
import { UserId } from "@mirai-app/domain";
import { LocationPortTag } from "../ports/LocationPort";
import { UserPortTag } from "../../user/ports/UserPort";
import type { PendingLocationSharingRequestsDTO } from "../dto/LocationDTOs";

/**
 * Input for GetPendingLocationSharingRequestsUseCase
 */
export interface GetPendingLocationSharingRequestsInput {
  userId: string;
}

/**
 * Get Pending Location Sharing Requests Use Case
 *
 * Retrieves pending location sharing requests received by the user.
 * Fetches complete user details for all senders and receivers.
 */
export class GetPendingLocationSharingRequestsUseCase {
  execute(input: GetPendingLocationSharingRequestsInput) {
    return Effect.gen(function* () {
      const locationPort = yield* LocationPortTag;
      const userPort = yield* UserPortTag;

      const userId = UserId.unsafeCreate(input.userId);
      const requests =
        yield* locationPort.findPendingSharingRequestsByReceiver(userId);

      if (requests.length === 0) {
        return {
          requests: [],
        };
      }

      // Collect unique user IDs to fetch
      const uniqueUserIds = new Map<string, UserId>();
      for (const request of requests) {
        const senderIdStr = UserId.toString(request.senderId);
        const receiverIdStr = UserId.toString(request.receiverId);
        if (!uniqueUserIds.has(senderIdStr)) {
          uniqueUserIds.set(senderIdStr, request.senderId);
        }
        if (!uniqueUserIds.has(receiverIdStr)) {
          uniqueUserIds.set(receiverIdStr, request.receiverId);
        }
      }

      // Fetch all user details in parallel
      const userEffects = Array.from(uniqueUserIds.values()).map((id) =>
        userPort.findById(id),
      );
      const users = yield* Effect.all(userEffects);

      // Build user lookup map (filter out null results)
      const userMap = new Map<string, NonNullable<typeof users[number]>>();
      const userIdKeys = Array.from(uniqueUserIds.keys());
      for (let index = 0; index < userIdKeys.length; index++) {
        const id = userIdKeys[index]!;
        const user = users[index];
        if (user !== null && user !== undefined) {
          userMap.set(id, user);
        }
      }

      // Build fully-populated DTOs
      const requestDTOs = requests.map((request) => {
        const senderIdStr = UserId.toString(request.senderId);
        const receiverIdStr = UserId.toString(request.receiverId);

        const sender = userMap.get(senderIdStr) ?? null;
        const receiver = userMap.get(receiverIdStr) ?? null;

        return {
          id: request.id,
          senderId: request.senderId,
          receiverId: request.receiverId,
          sender: sender
            ? {
                id: sender.id,
                firstName: sender.firstName,
                lastName: sender.lastName,
                image: sender.hasAvatar ? "" : null,
              }
            : null,
          receiver: receiver
            ? {
                id: receiver.id,
                firstName: receiver.firstName,
                lastName: receiver.lastName,
                image: receiver.hasAvatar ? "" : null,
              }
            : null,
          status: request.status,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
        };
      });

      return {
        requests: requestDTOs,
      };
    });
  }
}
