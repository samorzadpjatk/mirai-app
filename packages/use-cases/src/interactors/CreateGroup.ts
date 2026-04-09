import { Effect } from "effect";
import { Group, GroupStatus } from "@mirai-app/domain";
import type { GroupRepository } from "../ports/GroupRepository";
import {
  UseCaseConflictError,
  UseCaseRepositoryError,
  UseCaseValidationError,
  type UseCaseError,
} from "../errors";

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
 * CreateGroup Use Case
 *
 * Creates a new group in the system.
 * Returns error if validation fails or group code already exists.
 *
 * ## Constructor Injection Pattern
 *
 * This use case supports both manual instantiation and DI container injection:
 *
 * ```typescript
 * // Manual instantiation (backward compatible)
 * const useCase = new CreateGroupUseCase(groupRepository);
 *
 * // DI container injection (awilix-modular)
 * const useCase = container.resolve("createGroupUseCase");
 * ```
 */
export class CreateGroupUseCase {
  constructor(private groupRepository: GroupRepository) {}

  execute(
    input: CreateGroupInput,
  ): Effect.Effect<CreateGroupOutput, UseCaseError> {
    const groupRepository = this.groupRepository;
    const toOutput = this.toOutput.bind(this);

    return Effect.gen(function* () {
      const existingGroup = yield* Effect.tryPromise({
        try: () => groupRepository.findByCode(input.code),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "CreateGroup.findByCode",
            message: "Failed to check group code uniqueness",
            cause,
          }),
      });

      if (existingGroup) {
        return yield* Effect.fail(
          new UseCaseConflictError({
            entity: "Group",
            message: "Group code already exists",
          }),
        );
      }

      const groupResult = Group.create({
        tripId: input.tripId,
        name: input.name,
        description: input.description ?? null,
        image: input.image ?? null,
        organizerId: input.organizerId,
        code: input.code,
        coins: input.coins ?? 0,
        status: input.status ?? GroupStatus.ACTIVE,
      });

      if (groupResult.kind === "err") {
        return yield* Effect.fail(
          new UseCaseValidationError({
            field: "group",
            message: groupResult.error,
          }),
        );
      }

      const saved = yield* Effect.tryPromise({
        try: () => groupRepository.create(groupResult.value),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "CreateGroup.create",
            message: "Failed to create group",
            cause,
          }),
      });

      return toOutput(saved);
    });
  }

  private toOutput(group: Group): CreateGroupOutput {
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
    };
  }
}
