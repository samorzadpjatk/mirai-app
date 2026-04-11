import type { Result } from "@mirai-app/domain";
import { ok, err, type Location } from "@mirai-app/domain";
import type { LocationRepository } from "../ports/LocationRepository";

/**
 * Input for AddSharingUser use case
 */
export interface AddSharingUserInput {
  ownerUserId: string;
  userToAddId: string;
  userFirstName: string | null;
  userLastName: string | null;
}

/**
 * Output DTO for AddSharingUser use case
 */
export interface AddSharingUserOutput {
  id: string;
  userId: string;
  isSharingLocation: boolean;
  usersToShareWith: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
  }>;
}

/**
 * AddSharingUser Use Case
 *
 * Adds a user to the location sharing list.
 * Creates location record if it doesn't exist.
 */
export class AddSharingUserUseCase {
  constructor(private locationRepository: LocationRepository) {}

  async execute(
    input: AddSharingUserInput,
  ): Promise<Result<AddSharingUserOutput, string>> {
    // Prevent self-sharing
    if (input.ownerUserId === input.userToAddId) {
      return err("Cannot share location with yourself");
    }

    // Find existing location
    let location = await this.locationRepository.findByUserId(
      input.ownerUserId,
    );

    if (!location) {
      // Create new location with sharing enabled
      const { Location } = await import("@mirai-app/domain");
      const createResult = Location.create({
        userId: input.ownerUserId,
        isSharingLocation: true,
        usersToShareWith: [
          {
            id: input.userToAddId,
            firstName: input.userFirstName,
            lastName: input.userLastName,
          },
        ],
      });

      if (createResult.kind === "err") {
        return err(createResult.error.message);
      }

      const saved = await this.locationRepository.create(createResult.value);
      return ok(this.toOutput(saved));
    }

    // Add user to sharing list
    const addResult = location.addSharingUser({
      id: input.userToAddId,
      firstName: input.userFirstName,
      lastName: input.userLastName,
    });

    if (addResult.kind === "err") {
      return err(addResult.error.message);
    }

    // Persist changes
    const saved = await this.locationRepository.save(addResult.value);

    return ok(this.toOutput(saved));
  }

  private toOutput(location: Location): AddSharingUserOutput {
    return {
      id: location.id,
      userId: location.userId,
      isSharingLocation: location.isSharingLocation(),
      usersToShareWith: location.usersToShareWith,
    };
  }
}
