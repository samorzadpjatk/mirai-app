import type { Result } from "@repo/domain";
import { ok, err, type Location } from "@repo/domain";
import type { LocationRepository } from "../ports/LocationRepository";

/**
 * Input for RemoveSharingUser use case
 */
export interface RemoveSharingUserInput {
  ownerUserId: string;
  userToRemoveId: string;
}

/**
 * Output DTO for RemoveSharingUser use case
 */
export interface RemoveSharingUserOutput {
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
 * RemoveSharingUser Use Case
 *
 * Removes a user from the location sharing list.
 * Returns error if location not found.
 */
export class RemoveSharingUserUseCase {
  constructor(private locationRepository: LocationRepository) {}

  async execute(
    input: RemoveSharingUserInput,
  ): Promise<Result<RemoveSharingUserOutput, string>> {
    // Find existing location
    const location = await this.locationRepository.findByUserId(
      input.ownerUserId,
    );

    if (!location) {
      return err("Location not found");
    }

    // Remove user from sharing list
    const updated = location.removeSharingUser(input.userToRemoveId);

    // Persist changes
    const saved = await this.locationRepository.save(updated);

    return ok(this.toOutput(saved));
  }

  private toOutput(location: Location): RemoveSharingUserOutput {
    return {
      id: location.id,
      userId: location.userId,
      isSharingLocation: location.isSharingLocation(),
      usersToShareWith: location.usersToShareWith,
    };
  }
}
