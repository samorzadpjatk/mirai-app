import { Effect } from "effect";
import type { GroupRepository } from "../ports/GroupRepository";
import type { Group } from "@mirai-app/domain";
import {
  UseCaseNotFoundError,
  UseCaseRepositoryError,
  UseCaseValidationError,
  type UseCaseError,
} from "../errors";

/**
 * Input for UpdateGroup use case
 */
export interface UpdateGroupInput {
  groupId: string;
  name?: string;
  description?: string | null;
  image?: string | null;
  organizerId?: string;
  code?: string;
}

/**
 * Output DTO for UpdateGroup use case
 */
export interface UpdateGroupOutput {
  id: string;
  tripId: string;
  name: string;
  description: string | null;
  image: string | null;
  organizerId: string;
  code: string;
  coins: number;
  status: string;
  updatedAt: Date;
  isActive: boolean;
  summary: string;
}

/**
 * UpdateGroup Use Case
 *
 * Updates a group's details.
 * Returns error if group not found, is deleted, or validation fails.
 *
 * ## Constructor Injection Pattern
 *
 * This use case supports both manual instantiation and DI container injection:
 *
 * ```typescript
 * // Manual instantiation (backward compatible)
 * const useCase = new UpdateGroupUseCase(groupRepository);
 *
 * // DI container injection (awilix-modular)
 * const useCase = container.resolve("updateGroupUseCase");
 * ```
 */
export class UpdateGroupUseCase {
  constructor(private groupRepository: GroupRepository) {}

  execute(
    input: UpdateGroupInput,
  ): Effect.Effect<UpdateGroupOutput, UseCaseError> {
    const groupRepository = this.groupRepository;
    const toOutput = this.toOutput.bind(this);

    return Effect.gen(function* () {
      const group = yield* Effect.tryPromise({
        try: () => groupRepository.findById(input.groupId),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "UpdateGroup.findById",
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

      if (group.isDeleted()) {
        return yield* Effect.fail(
          new UseCaseValidationError({
            field: "status",
            message: "Cannot update a deleted group",
          }),
        );
      }

      let updatedGroup: Group = group;

      if (
        input.name !== undefined ||
        input.description !== undefined ||
        input.image !== undefined
      ) {
        const detailsResult = updatedGroup.updateDetails({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
          ...(input.image !== undefined && { image: input.image }),
        });

        if (detailsResult.kind === "err") {
          return yield* Effect.fail(
            new UseCaseValidationError({
              field: "group",
              message: detailsResult.error,
            }),
          );
        }

        updatedGroup = detailsResult.value;
      }

      if (input.organizerId !== undefined) {
        updatedGroup = updatedGroup.changeOrganizer(input.organizerId);
      }

      const saved = yield* Effect.tryPromise({
        try: () => groupRepository.update(updatedGroup),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "UpdateGroup.update",
            message: "Failed to update group",
            cause,
          }),
      });

      return toOutput(saved);
    });
  }

  private toOutput(group: Group): UpdateGroupOutput {
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
      updatedAt: group.updatedAt,
      isActive: group.isActive(),
      summary: group.getSummary(),
    };
  }
}
