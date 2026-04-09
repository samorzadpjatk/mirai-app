import type { GroupRepository } from "../ports/GroupRepository";
import type { Group } from "@mirai-app/domain";
import {
  UseCaseNotFoundError,
  UseCaseRepositoryError,
  UseCaseValidationError,
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

  async execute(input: UpdateGroupInput): Promise<UpdateGroupOutput> {
    // Load group
    let group: Group | null;
    try {
      group = await this.groupRepository.findById(input.groupId);
    } catch (cause) {
      throw new UseCaseRepositoryError({
        operation: "UpdateGroup.findById",
        message: "Failed to load group",
        cause,
      });
    }

    if (!group) {
      throw new UseCaseNotFoundError({
        entity: "Group",
        message: "Group not found",
      });
    }

    if (group.isDeleted()) {
      throw new UseCaseValidationError({
        field: "status",
        message: "Cannot update a deleted group",
      });
    }

    let updatedGroup: Group = group;

    // Update details if provided
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
        throw new UseCaseValidationError({
          field: "group",
          message: detailsResult.error,
        });
      }

      updatedGroup = detailsResult.value;
    }

    // Update organizer if provided
    if (input.organizerId !== undefined) {
      updatedGroup = updatedGroup.changeOrganizer(input.organizerId);
    }

    // Save updated group
    let saved: Group;
    try {
      saved = await this.groupRepository.update(updatedGroup);
    } catch (cause) {
      throw new UseCaseRepositoryError({
        operation: "UpdateGroup.update",
        message: "Failed to update group",
        cause,
      });
    }

    return this.toOutput(saved);
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
