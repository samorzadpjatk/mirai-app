import type {
  Challenge,
  ChallengeStatus,
  ScoringCategory,
  SubmissionType,
} from "@mirai-app/domain";
import type { ChallengeRepository } from "@mirai-app/use-cases";
import { InMemoryRepository } from "./InMemoryRepository";

/**
 * In-Memory Challenge Repository for Testing
 *
 * Implements ChallengeRepository port with in-memory storage.
 *
 * @example
 * ```typescript
 * const repo = new InMemoryChallengeRepository();
 * repo.seed([mockChallenge]);
 *
 * const byTrip = await repo.findByTripId("trip-123");
 * expect(byTrip).toHaveLength(1);
 *
 * repo.reset();
 * ```
 */
export class InMemoryChallengeRepository
  extends InMemoryRepository<Challenge>
  implements ChallengeRepository
{
  async create(challenge: Challenge): Promise<Challenge> {
    return this.createGeneric(challenge);
  }

  async findById(id: string): Promise<Challenge | null> {
    return this.findByIdGeneric(id);
  }

  async findByTripId(tripId: string): Promise<Challenge[]> {
    return this.getAllItems().filter((c) => c.tripId === tripId);
  }

  async findByStatus(status: ChallengeStatus): Promise<Challenge[]> {
    return this.getAllItems().filter((c) => c.status === status);
  }

  async findByTripIdAndStatus(
    tripId: string,
    status: ChallengeStatus,
  ): Promise<Challenge[]> {
    return this.getAllItems().filter(
      (c) => c.tripId === tripId && c.status === status,
    );
  }

  async findBySubmissionType(type: SubmissionType): Promise<Challenge[]> {
    return this.getAllItems().filter((c) => c.submissionType === type);
  }

  async findByScoringCategory(category: ScoringCategory): Promise<Challenge[]> {
    return this.getAllItems().filter((c) => c.scoringCategory === category);
  }

  async findActive(): Promise<Challenge[]> {
    return this.findByStatus("ACTIVE" as ChallengeStatus);
  }

  async findOpenForSubmission(): Promise<Challenge[]> {
    const now = new Date();
    return this.getAllItems().filter((c) => {
      if (c.status !== ("ACTIVE" as ChallengeStatus)) return false;
      if (c.startTime && c.startTime > now) return false;
      if (c.endTime && c.endTime < now) return false;
      return true;
    });
  }

  async findRecurring(): Promise<Challenge[]> {
    return this.getAllItems().filter((c) => c.isRecurring);
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Challenge[]> {
    return this.findAllGeneric(options);
  }

  async update(challenge: Challenge): Promise<Challenge> {
    return this.updateGeneric(challenge);
  }

  async updateStatus(id: string, status: ChallengeStatus): Promise<Challenge> {
    const challenge = await this.findById(id);
    if (!challenge) {
      throw new Error(`Challenge with id ${id} not found`);
    }
    // Create new challenge with updated status
    const updated = new (challenge.constructor as new (
      ...args: unknown[]
    ) => Challenge)(
      challenge.id,
      challenge.tripId,
      challenge.name,
      challenge.description,
      challenge.image,
      challenge.submissionType,
      challenge.scoringCategory,
      challenge.isRecurring,
      challenge.dailyStartTime,
      challenge.dailyEndTime,
      challenge.basePoints,
      challenge.firstPlacePoints,
      challenge.secondPlacePoints,
      challenge.thirdPlacePoints,
      status,
      challenge.startTime,
      challenge.endTime,
      challenge.votingStartTime,
      challenge.votingEndTime,
      challenge.targetLatitude,
      challenge.targetLongitude,
      challenge.expectedValue,
      challenge.autoApprove,
      challenge.createdAt,
      new Date(), // updatedAt
    );
    return this.updateGeneric(updated);
  }

  async delete(id: string): Promise<void> {
    return this.deleteGeneric(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.existsGeneric(id);
  }

  async countByTripId(tripId: string): Promise<number> {
    return this.findByTripId(tripId).then((items) => items.length);
  }
}
