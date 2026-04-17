import { Effect } from "effect";
import type { ApplicationError, ValidationError } from "@mirai-app/domain";
import { User, TripParticipant, AuthUserId, TripId } from "@mirai-app/domain";
import { UserPortTag } from "../ports/UserPort";
import { TripParticipantPort } from "../ports/TripParticipantPort";
import { AuthServicePort } from "../ports/AuthServicePort";
import type { CreateUserResultDTO } from "../dto/UserDTOs";

/**
 * Input for CreateUserUseCase
 */
export interface CreateUserInput {
  tripId: string;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Create User Use Case
 *
 * Creates a new user with auth and adds them to a trip.
 */
export class CreateUserUseCase {
  execute(
    input: CreateUserInput,
  ): Effect.Effect<
    CreateUserResultDTO,
    ApplicationError | ValidationError,
    UserPortTag | TripParticipantPort | AuthServicePort
  > {
    return Effect.gen(function* () {
      const userPort = yield* UserPortTag;
      const participantPort = yield* TripParticipantPort;
      const authService = yield* AuthServicePort;

      // Create auth user
      const authUser = yield* authService.createAuthUser({
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
      });

      // Check if user already exists by authUserId
      const existingUser = yield* userPort.findByAuthUserId(authUser.id);

      let user;
      if (existingUser) {
        user = existingUser;
      } else {
        // Create domain user using factory - ID will be auto-generated
        const authUserId = AuthUserId.unsafeCreate(authUser.id);

        const userEffect = User.create({
          authUserId: authUserId,
          firstName: input.firstName,
          lastName: input.lastName,
          hasAvatar: false,
          role: "USER",
          lastSeenOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const newUser = yield* userEffect;
        user = yield* userPort.create(newUser);
      }

      // Create trip participant - ID will be auto-generated
      const tripId = TripId.unsafeCreate(input.tripId);

      const participantEffect = TripParticipant.create({
        userId: user.id,
        tripId: tripId,
        groupId: null,
        wristNumber: null,
        houseNumber: null,
        role: "MEMBER",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const newParticipant = yield* participantEffect;
      const participant = yield* participantPort.upsert(newParticipant);

      const result: CreateUserResultDTO = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: authUser.email,
        role: user.role,
        wristNumber: participant.wristNumber,
        houseNumber: participant.houseNumber,
        groupId: null,
        groupName: null,
        tripId: input.tripId,
      };

      return result;
    });
  }
}
