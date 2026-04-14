import { Group, type GroupId } from "@mirai-app/domain";
import { Effect, Data } from "effect";
import { GroupRepositoryTag } from "../ports/GroupRepository";

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
 *   Effect.provideService(GroupRepositoryTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function getGroupUseCase(
  input: GetGroupInput,
): Effect.Effect<GetGroupOutput, GetGroupNotFoundError, GroupRepositoryTag> {
  return Effect.gen(function* () {
    const groupRepo = yield* GroupRepositoryTag;

    const group = yield* groupRepo.findById(input.groupId);

    if (!group) {
      return yield* Effect.fail(
        new GetGroupNotFoundError({ groupId: input.groupId }),
      );
    }

    return toOutput(group);
  });
}

function toOutput(group: Group): GetGroupOutput {
  return {
    id: group.id,
    tripId: group.tripId,
    name: group.name,
    description: group.description,
    image: group.image,
    organizerId: group.organizerId,
    code: group.code,
    coins: group.coins,
    status: group.status,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    isActive: group.isActive(),
    summary: group.getSummary(),
  };
}
