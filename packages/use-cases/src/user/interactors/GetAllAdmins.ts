import { Effect } from "effect";
import { UserPortTag } from "../ports/UserPort";
import type { AdminNameDTO } from "../dto/UserDTOs";

/**
 * Get All Admins Names Use Case
 *
 * Retrieves names of all admin users.
 */
export class GetAllAdminsNamesUseCase {
  execute() {
    return Effect.gen(function* () {
      const userPort = yield* UserPortTag;

      // Get all users with ADMIN or MODERATOR role
      const allUsers = yield* userPort.findAll();

      const admins = allUsers.filter(
        (user): boolean => user.role === "ADMIN" || user.role === "MODERATOR",
      );

      const result: AdminNameDTO[] = admins.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
      }));

      return result;
    });
  }
}
