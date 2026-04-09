import type { Result } from "@mirai-app/domain";
import { ok, err, type Location } from "@mirai-app/domain";
import type { LocationRepository } from "../ports/LocationRepository";

/**
 * Input for GetSharingSettings use case
 */
export interface GetSharingSettingsInput {
  userId: string;
}

/**
 * Output DTO for GetSharingSettings use case
 */
export interface GetSharingSettingsOutput {
  isSharingLocation: boolean;
  usersToShareWith: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
  }>;
}

/**
 * GetSharingSettings Use Case
 *
 * Retrieves location sharing settings for a user.
 * Returns default settings if no location exists.
 */
export class GetSharingSettingsUseCase {
  constructor(private locationRepository: LocationRepository) {}

  async execute(
    input: GetSharingSettingsInput,
  ): Promise<Result<GetSharingSettingsOutput, string>> {
    const location = await this.locationRepository.findByUserId(input.userId);

    if (!location) {
      // Return default settings
      return ok({
        isSharingLocation: false,
        usersToShareWith: [],
      });
    }

    return ok({
      isSharingLocation: location.isSharingLocation(),
      usersToShareWith: location.usersToShareWith,
    });
  }
}
