import { type GroupId, GroupStatus } from "@mirai-app/domain";
import { Effect, Data } from "effect";
import { GroupGatewayTag } from "../ports/gateway";
import { DatabaseError } from "@mirai-app/domain";
import type { GroupDTO } from "../dto";

/**
 * Input for GetGroup use case
 */
export interface GetGroupInput {
  groupId: string;
}

/**
 * Output DTO for GetGroup use case
 */
export interface GetGroupOutput {
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
  isActive: boolean;
  summary: string;
}

/**
 * Error type for GetGroup use case - uses Data.TaggedError for Effect integration
 */
export class GetGroupNotFoundError extends Data.TaggedError(
  "GetGroupNotFoundError",
)<{ groupId: string }> {}

/**
 * GetGroup Use Case
 *
 * Retrieves a group by ID.
 * Fails with GetGroupNotFoundError if group not found.
 *
 * ## Effect.gen Pattern
 *
 * This use case uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* getGroupUseCase({ groupId: "123" });
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
export function getGroupUseCase(
  input: GetGroupInput,
): Effect.Effect<
  GetGroupOutput,
  DatabaseError | GetGroupNotFoundError,
  GroupGatewayTag
> {
  return Effect.gen(function* () {
    const groupRepo = yield* GroupGatewayTag;

    const group = yield* groupRepo.findById(input.groupId);

    if (!group) {
      return yield* Effect.fail(
        new GetGroupNotFoundError({ groupId: input.groupId }),
      );
    }

    return toOutput(group);
  });
}

function toOutput(group: GroupDTO): GetGroupOutput {
  const isActive = group.status === GroupStatus.ACTIVE && !group.deletedAt;
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
    isActive,
    summary: `${group.name} (${group.code}) - ${group.coins} coins`,
  };
}
