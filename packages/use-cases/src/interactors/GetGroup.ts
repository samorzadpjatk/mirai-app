import { Effect } from "effect";
import type { GroupRepository } from "../ports/GroupRepository";
import type { Group } from "@mirai-app/domain";
import {
  UseCaseNotFoundError,
  UseCaseRepositoryError,
  type UseCaseError,
} from "../errors";

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
 * GetGroup Use Case
 *
 * Retrieves a group by ID.
 * Returns error if group not found.
 *
 * ## Constructor Injection Pattern
 *
 * This use case supports both manual instantiation and DI container injection:
 *
 * ```typescript
 * // Manual instantiation (backward compatible)
 * const useCase = new GetGroupUseCase(groupRepository);
 *
 * // DI container injection (awilix-modular)
 * const useCase = container.resolve("getGroupUseCase");
 * ```
 */
export class GetGroupUseCase {
  constructor(private groupRepository: GroupRepository) {}

  execute(input: GetGroupInput): Effect.Effect<GetGroupOutput, UseCaseError> {
    const groupRepository = this.groupRepository;
    const toOutput = this.toOutput.bind(this);

    return Effect.gen(function* () {
      const group = yield* Effect.tryPromise({
        try: () => groupRepository.findById(input.groupId),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "GetGroup.findById",
            message: "Failed to load group",
            cause,
          }),
      });

      if (!group) {
        return yield* Effect.fail(
          new UseCaseNotFoundError({
            entity: "Group",
            message: "Group not found",
          }),
        );
      }

      return toOutput(group);
    });
  }

  private toOutput(group: Group): GetGroupOutput {
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
}
