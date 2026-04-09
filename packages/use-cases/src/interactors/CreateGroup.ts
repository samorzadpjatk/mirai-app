import { Group, GroupStatus } from "@mirai-app/domain";
import type { GroupRepository } from "../ports/GroupRepository";
import { AppError } from "../errors";

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

  async execute(input: CreateGroupInput): Promise<CreateGroupOutput> {
    // Check if group code already exists
    let existingGroup: import("@mirai-app/domain").Group | null;
    try {
      existingGroup = await this.groupRepository.findByCode(input.code);
    } catch (cause) {
      throw AppError.repository({
        operation: "CreateGroup.findByCode",
        message: "Failed to check group code uniqueness",
        cause,
      });
    }

    if (existingGroup) {
      throw AppError.conflict({
        entity: "Group",
        message: "Group code already exists",
      });
    }

    // Create domain entity
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
      throw AppError.validation({
        field: "group",
        message: groupResult.error,
      });
    }

    // Save to repository
    let saved: import("@mirai-app/domain").Group;
    try {
      saved = await this.groupRepository.create(groupResult.value);
    } catch (cause) {
      throw AppError.repository({
        operation: "CreateGroup.create",
        message: "Failed to create group",
        cause,
      });
    }

    return this.toOutput(saved);
  }

  private toOutput(
    group: import("@mirai-app/domain").Group,
  ): CreateGroupOutput {
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
