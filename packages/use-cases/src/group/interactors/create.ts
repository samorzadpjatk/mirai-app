import { Group, GroupStatus, ValidationError } from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { GroupGatewayTag } from "../ports/gateway";
import { DatabaseError } from "@mirai-app/domain";
import type { GroupDTO } from "../dto";

/**
 * Input for CreateGroup use case
 */
export interface CreateGroupInput {
  tripId: string;
  name: string;
  description?: string | null;
  image?: string | null;
  organizerId: string;
  code: string;
  coins?: number;
  status?: GroupStatus;
}

/**
 * Output DTO for CreateGroup use case
 */
export interface CreateGroupOutput {
  id: string;
  tripId: string;
  name: string;
  description: string | null;
  image: string | null;
  organizerId: string;
  code: string;
  coins: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Error types for CreateGroup use case
 */
export class GroupCodeAlreadyExistsError extends Data.TaggedError(
  "GroupCodeAlreadyExistsError",
)<{
  message: string;
}> {}

export class GroupCreationError extends Data.TaggedError("GroupCreationError")<{
  message: string;
}> {}

/**
 * CreateGroup Use Case
 *
 * Creates a new group in the system.
 * Returns error if validation fails or group code already exists.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* createGroupUseCase(input);
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(GroupGatewayTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function createGroupUseCase(
  input: CreateGroupInput,
): Effect.Effect<
  CreateGroupOutput,
  DatabaseError | GroupCodeAlreadyExistsError | GroupCreationError,
  GroupGatewayTag
> {
  return Effect.gen(function* () {
    const groupRepo = yield* GroupGatewayTag;

    // Check if group code already exists
    const existingGroup = yield* groupRepo.findByCode(input.code);

    if (existingGroup) {
      return yield* Effect.fail(
        new GroupCodeAlreadyExistsError({
          message: "Group code already exists",
        }),
      );
    }

    // Create domain entity using Effect-based static create method
    const group = yield* Group.create({
      tripId: input.tripId,
      name: input.name,
      description: input.description ?? null,
      image: input.image ?? null,
      organizerId: input.organizerId,
      code: input.code,
      coins: input.coins ?? 0,
      status: input.status ?? GroupStatus.ACTIVE,
    }).pipe(
      Effect.mapError(
        (validationError: ValidationError) =>
          new GroupCreationError({ message: validationError.message }),
      ),
    );

    // Convert entity to DTO
    const groupDTO: GroupDTO = {
      id: group.id,
      tripId: group.tripId,
      name: group.name,
      code: group.code,
      description: group.description,
      imageUrl: group.image,
      status: group.status,
      coins: group.coins,
      maxMembers: null,
      createdById: group.organizerId,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      deletedAt: null,
      deletedById: null,
    };

    // Save to repository
    const saved = yield* groupRepo.create(groupDTO);

    return toOutput(saved);
  });
}

function toOutput(group: GroupDTO): CreateGroupOutput {
  return {
    id: group.id,
    tripId: group.tripId,
    name: group.name,
    description: group.description,
    image: group.imageUrl,
    organizerId: group.createdById,
    code: group.code,
    coins: group.coins,
    status: group.status,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
}
