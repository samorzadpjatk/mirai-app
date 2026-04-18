import { Effect, Data } from "effect";
import { Group, TripParticipant, TripId, UserId } from "@mirai-app/domain";
import { GroupPortTag } from "../ports/GroupPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { GroupJoinRequestPortTag } from "../ports/GroupJoinRequestPort";
import { UserPortTag } from "../../user/ports/UserPort";
import type { CreateGroupResultDTO, GroupMemberDTO } from "../dto/GroupDTOs";

/**
 * Input for CreateGroupUseCase
 */
export interface CreateGroupInput {
  tripId: string;
  name: string;
  description?: string;
  image?: string;
  organizerId?: string;
  creatorId: string;
  code: string;
}

/**
 * Code generation failed error
 */
export class CodeGenerationError extends Data.TaggedError("CodeGenerationError")<{
  message: string;
}> {}

/**
 * Create Group Use Case
 *
 * Creates a new group and assigns the creator as a member.
 */
export class CreateGroupUseCase {
  execute(input: CreateGroupInput) {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPortTag;
      const participantPort = yield* TripParticipantPortTag;
      const joinRequestPort = yield* GroupJoinRequestPortTag;
      const userPort = yield* UserPortTag;

      // Create the group entity - ID will be auto-generated
      const tripId = TripId.unsafeCreate(input.tripId);
      const organizerId = UserId.unsafeCreate(
        input.organizerId ?? input.creatorId,
      );

      const groupEffect = Group.create({
        tripId,
        name: input.name,
        description: input.description ?? null,
        image: input.image ?? null,
        organizerId,
        code: input.code,
        coins: 0,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const group = yield* groupEffect;

      // Save the group
      const createdGroup = yield* groupPort.create(group);

      // Create trip participant for organizer - ID will be auto-generated
      const userId = UserId.unsafeCreate(input.creatorId);

      const participantEffect = TripParticipant.create({
        userId,
        tripId,
        groupId: createdGroup.id,
        wristNumber: null,
        houseNumber: null,
        role: "LEADER",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const participant = yield* participantEffect;

      // Assign creator as participant and clean up any join requests
      const userIdForRequest = UserId.unsafeCreate(
        input.organizerId ?? input.creatorId,
      );
      yield* Effect.all([
        participantPort.upsert(participant),
        joinRequestPort.deleteByUserAndTrip(userIdForRequest, tripId),
      ]);

      // Fetch organizer data for the response
      const organizer = yield* userPort.findById(organizerId);

      // Build organizer DTO
      const organizerDto: GroupMemberDTO | null = organizer
        ? {
            id: organizer.id,
            firstName: organizer.firstName,
            lastName: organizer.lastName,
            email: null,
          }
        : null;

      return {
        id: createdGroup.id,
        tripId: createdGroup.tripId,
        name: createdGroup.name,
        description: createdGroup.description,
        image: createdGroup.image,
        code: createdGroup.code,
        coins: createdGroup.coins,
        organizer: organizerDto,
      } as CreateGroupResultDTO;
    });
  }
}
