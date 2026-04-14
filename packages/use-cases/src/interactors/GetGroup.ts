import { Group, type Result, ok, err } from "@mirai-app/domain";
import { Effect } from "effect";
import type { GroupRepository } from "../ports/GroupRepository";

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
 * ## Effect.gen Pattern
 *
 * This use case uses constructor injection and returns Effect.Effect<Result<T,E>, never, never>:
 *
 * ```typescript
 * const useCase = new GetGroupUseCase(groupRepository);
 * const result = await Effect.runPromise(useCase.execute({ groupId: "123" }));
 *
 * if (result.kind === "ok") {
 *   logger.debug("Group retrieved", result.value);
 * } else {
 *   logger.error("Failed to get group", result.error);
 * }
 * ```
 */
export class GetGroupUseCase {
  constructor(private readonly groupRepo: GroupRepository) {}

  execute(
    input: GetGroupInput,
  ): Effect.Effect<
    Result<GetGroupOutput, GetGroupNotFoundError>,
    never,
    never
  > {
    return Effect.gen(this, function* () {
      const group = yield* this.groupRepo.findById(input.groupId);

      if (!group) {
        return err(new GetGroupNotFoundError());
      }

      return ok(toOutput(group));
    });
  }
}

/**
 * Legacy function-based API for backward compatibility during migration
 * @deprecated Use GetGroupUseCase class instead
 */
export function getGroupUseCase(
  input: GetGroupInput,
  groupRepo: GroupRepository,
): Effect.Effect<Result<GetGroupOutput, GetGroupNotFoundError>, never, never> {
  const useCase = new GetGroupUseCase(groupRepo);
  return useCase.execute(input);
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
