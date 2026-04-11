import type { GroupRepository } from "../ports/GroupRepository";
import type { Group } from "@mirai-app/domain";
import type { Result } from "@mirai-app/domain";
import { ok, err } from "@mirai-app/domain";

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

  async execute(input: UpdateGroupInput): Promise<Result<UpdateGroupOutput, string>> {
    // Load group
    let group: Group | null;
    try {
      group = await this.groupRepository.findById(input.groupId);
    } catch (_cause) {
      return err("Failed to load group");
    }

    if (!group) {
      return err("Group not found");
    }

    if (group.isDeleted()) {
      return err("Cannot update a deleted group");
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
        return err(detailsResult.error.message);
      }

      updatedGroup = detailsResult.value;
    }

    // Update organizer if provided
    if (input.organizerId !== undefined) {
      const organizerResult = updatedGroup.changeOrganizer(input.organizerId);
      if (organizerResult.kind === "err") {
        return err(organizerResult.error.message);
      }
      updatedGroup = organizerResult.value;
    }

    // Save updated group
    let saved: Group;
    try {
      saved = await this.groupRepository.update(updatedGroup);
    } catch (_cause) {
      return err("Failed to update group");
    }

    return ok(this.toOutput(saved));
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
