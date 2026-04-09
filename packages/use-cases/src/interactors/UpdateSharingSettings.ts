import type { Result } from "@repo/domain";
import { ok, err, type Location } from "@repo/domain";
import type { LocationRepository } from "../ports/LocationRepository";

/**
 * Input for UpdateSharingSettings use case
 */
export interface UpdateSharingSettingsInput {
  userId: string;
  isSharingLocation: boolean;
  usersToShareWith?: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
  }>;
}

/**
 * Output DTO for UpdateSharingSettings use case
 */
export interface UpdateSharingSettingsOutput {
  id: string;
  userId: string;
  isSharingLocation: boolean;
  usersToShareWith: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
  }>;
  timestamp: Date;
}

/**
 * UpdateSharingSettings Use Case
 *
 * Updates location sharing settings for a user.
 * Creates location record if it doesn't exist.
 */
export class UpdateSharingSettingsUseCase {
  constructor(private locationRepository: LocationRepository) {}

  async execute(
    input: UpdateSharingSettingsInput,
  ): Promise<Result<UpdateSharingSettingsOutput, string>> {
    // Find existing location
    let location = await this.locationRepository.findByUserId(input.userId);

    if (!location) {
      // Create new location if none exists
      const { Location } = await import("@repo/domain");
      const createResult = Location.create({
        userId: input.userId,
        isSharingLocation: input.isSharingLocation,
        ...(input.usersToShareWith !== undefined && {
          usersToShareWith: input.usersToShareWith,
        }),
      });

      if (createResult.kind === "err") {
        return err(createResult.error);
      }

      location = createResult.value;
    } else {
      // Update sharing status
      if (input.isSharingLocation) {
        location = location.startSharing();
      } else {
        location = location.stopSharing();
      }

      // Update sharing users if provided
      if (input.usersToShareWith !== undefined) {
        const usersResult = location.updateSharingUsers(input.usersToShareWith);
        if (usersResult.kind === "err") {
          return err(usersResult.error);
        }
        location = usersResult.value;
      }
    }

    // Persist changes
    const saved = await this.locationRepository.save(location);

    return ok(this.toOutput(saved));
  }

  private toOutput(location: Location): UpdateSharingSettingsOutput {
    return {
      id: location.id,
      userId: location.userId,
      isSharingLocation: location.isSharingLocation(),
      usersToShareWith: location.usersToShareWith,
      timestamp: location.timestamp,
    };
  }
}
