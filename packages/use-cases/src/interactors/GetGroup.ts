import { Group } from "@mirai-app/domain";
import { Effect } from "effect";
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
 * Error type for GetGroup use case
 */
export class GetGroupNotFoundError extends Error {
  readonly _tag = "GetGroupNotFoundError";
  constructor() {
    super("Group not found");
  }
}

/**
 * GetGroup Use Case
 *
 * Retrieves a group by ID.
 * Returns error if group not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
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
      return yield* Effect.fail(new GetGroupNotFoundError());
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
