import { Effect, Data } from "effect";
import { Group, TripParticipant, TripId, UserId } from "@mirai-app/domain";
import { GroupPort } from "../ports/GroupPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import { GroupJoinRequestPort } from "../ports/GroupJoinRequestPort";
import type { CreateGroupResultDTO } from "../dto/GroupDTOs";
import type { DatabaseError } from "@mirai-app/domain";
import { TripNotFoundError, TripHasEndedError } from "../errors/GroupErrors";

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
export class CodeGenerationError extends Data.TaggedError(
  "CodeGenerationError",
)<{
  message: string;
}>() {}

/**
 * Create Group Use Case
 *
 * Creates a new group and assigns the creator as a member.
 */
export class CreateGroupUseCase {
  execute(
    input: CreateGroupInput,
  ): Effect.Effect<
    CreateGroupResultDTO,
    DatabaseError | TripNotFoundError | TripHasEndedError | CodeGenerationError,
    GroupPort | TripParticipantPort | GroupJoinRequestPort
  > {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPort;
      const participantPort = yield* TripParticipantPort;
      const joinRequestPort = yield* GroupJoinRequestPort;

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
      yield* Effect.all([
        participantPort.upsert(participant),
        joinRequestPort.deleteByUserAndTrip(
          input.organizerId ?? input.creatorId,
          input.tripId,
        ),
      ]);

      return {
        id: createdGroup.id,
        tripId: createdGroup.tripId,
        name: createdGroup.name,
        description: createdGroup.description,
        image: createdGroup.image,
        code: createdGroup.code,
        coins: createdGroup.coins,
        organizer: null, // Will be hydrated by adapter
      };
    });
  }
}
