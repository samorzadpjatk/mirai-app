import { Effect } from "effect";
import type {
  ApplicationError,
  RewardId,
  UserId,
  GroupId,
  ValidationError,
  InsufficientResourcesError,
} from "@mirai-app/domain";
import {
  RewardId as RewardIdFactory,
  UserId as UserIdFactory,
  GroupId as GroupIdFactory,
  RewardPurchaseId,
  CoinTransactionId,
  CoinTransaction,
  RewardPurchase as RewardPurchaseEntity,
} from "@mirai-app/domain";
import { RewardPort } from "../ports/RewardPort";
import { RewardPurchasePort } from "../ports/RewardPurchasePort";
import { GroupPort } from "../../group/ports/GroupPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import type { PurchaseRewardResultDTO } from "../dto/RewardDTOs";
import { CoinTransactionPort } from "../../coin/ports/CoinTransactionPort";
import {
  RewardNotFoundError,
  RewardHiddenError,
  RewardOutOfStockError,
  InsufficientCoinsError,
  NotGroupLeaderError,
  GroupNotFoundError,
  TripNotFoundError,
  TripEndedError,
  GroupNotInTripError,
} from "../errors/RewardErrors";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";

/**
 * Input for PurchaseRewardUseCase
 */
export interface PurchaseRewardInput {
  rewardId: string;
  quantity: number;
  userId: string;
}

/**
 * Purchase Reward Use Case
 *
 * Allows a group leader to purchase a reward for their group.
 */
export class PurchaseRewardUseCase {
  execute(
    input: PurchaseRewardInput,
  ): Effect.Effect<
    PurchaseRewardResultDTO,
    | ApplicationError
    | ValidationError
    | InsufficientResourcesError
    | RewardNotFoundError
    | RewardHiddenError
    | RewardOutOfStockError
    | InsufficientCoinsError
    | NotGroupLeaderError
    | GroupNotFoundError
    | TripNotFoundError
    | TripEndedError
    | GroupNotInTripError,
    | RewardPort
    | RewardPurchasePort
    | GroupPort
    | TripPortTag
    | TripParticipantPort
    | CoinTransactionPort
    | ChallengePortTag
  > {
    return Effect.gen(function* () {
      const rewardPort = yield* RewardPort;
      const purchasePort = yield* RewardPurchasePort;
      const groupPort = yield* GroupPort;
      const tripPort = yield* TripPortTag;
      const participantPort = yield* TripParticipantPort;
      const coinTransactionPort = yield* CoinTransactionPort;
      const challengePort = yield* ChallengePortTag;

      // Find reward
      const rewardId = RewardIdFactory.unsafeCreate(input.rewardId);
      const reward = yield* rewardPort.findById(rewardId);

      if (!reward) {
        return yield* Effect.fail(
          new RewardNotFoundError({ rewardId: input.rewardId }),
        );
      }

      // Check if hidden
      if (reward.isHidden) {
        return yield* Effect.fail(
          new RewardHiddenError({ rewardId: input.rewardId }),
        );
      }

      // Check stock
      if (reward.availableQuantity < input.quantity) {
        return yield* Effect.fail(
          new RewardOutOfStockError({
            rewardId: input.rewardId,
            requestedQuantity: input.quantity,
            availableQuantity: reward.availableQuantity,
          }),
        );
      }

      // Check trip not ended
      const trip = yield* tripPort.findById(reward.tripId);
      if (!trip) {
        return yield* Effect.fail(
          new TripNotFoundError({ tripId: reward.tripId }),
        );
      }

      if (trip.hasEnded()) {
        return yield* Effect.fail(
          new TripEndedError({
            tripId: reward.tripId,
            endedAt: trip.endDate,
          }),
        );
      }

      // Get user's participant record for this trip
      const participant = yield* participantPort.findByUserAndTrip(
        input.userId,
        reward.tripId,
      );

      if (!participant?.groupId) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: "unknown" }),
        );
      }

      // Get group
      const group = yield* groupPort.findById(participant.groupId);

      if (!group) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: participant.groupId }),
        );
      }

      // Verify group belongs to the same trip
      if (group.tripId !== reward.tripId) {
        return yield* Effect.fail(
          new GroupNotInTripError({
            groupId: group.id,
            tripId: reward.tripId,
          }),
        );
      }

      // Verify user is group leader
      if (group.organizerId !== input.userId) {
        return yield* Effect.fail(
          new NotGroupLeaderError({
            userId: input.userId,
            groupId: group.id,
          }),
        );
      }

      // Calculate dynamic coin cost
      const challenges = yield* challengePort.findByTripId(reward.tripId);
      let totalAvailablePoints = 0;
      for (const challenge of challenges) {
        totalAvailablePoints += challenge.basePoints;
        if (challenge.scoringCategory !== "UNLIMITED") {
          totalAvailablePoints += challenge.firstPlacePoints ?? 0;
          totalAvailablePoints += challenge.secondPlacePoints ?? 0;
          totalAvailablePoints += challenge.thirdPlacePoints ?? 0;
        }
      }

      let dynamicCoinCost = reward.coinCost;
      if (totalAvailablePoints > 0) {
        const percentageOfTotal = reward.coinCost / 100;
        dynamicCoinCost = Math.round(totalAvailablePoints * percentageOfTotal);
        dynamicCoinCost = Math.max(1, dynamicCoinCost);
      }

      const totalCost = dynamicCoinCost * input.quantity;

      // Check if group has enough coins
      if (group.coins < totalCost) {
        return yield* Effect.fail(
          new InsufficientCoinsError({
            groupId: group.id,
            required: totalCost,
            available: group.coins,
          }),
        );
      }

      // Decrease reward quantity
      const decrementedReward = yield* reward.decreaseQuantity(input.quantity);
      yield* rewardPort.update(decrementedReward);

      // Deduct coins from group
      const updatedGroup = yield* group.subtractCoins(totalCost);
      yield* groupPort.update(updatedGroup);

      // Create purchase record
      const now = new Date();
      const purchaseId = RewardPurchaseId.generate();
      const userId = UserIdFactory.unsafeCreate(input.userId);

      const purchaseEffect = RewardPurchaseEntity.create({
        id: purchaseId,
        rewardId: reward.id,
        groupId: group.id,
        quantity: input.quantity,
        totalCost,
        status: "BOUGHT",
        purchasedById: userId,
        statusUpdatedById: userId,
        statusUpdatedAt: now,
        collectionMethod: null,
        purchasedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      const purchase = yield* purchaseEffect;
      yield* purchasePort.create(purchase);

      // Create coin transaction record
      const transactionId = CoinTransactionId.generate();
      const transactionEffect = CoinTransaction.create({
        id: transactionId,
        groupId: group.id,
        amount: -totalCost,
        type: "SPENT",
        reason: `Claimed ${input.quantity}x ${reward.name}`,
        adminId: userId,
        createdAt: now,
      });

      const transaction = yield* transactionEffect;
      yield* coinTransactionPort.create(transaction);

      return {
        id: purchase.id,
        rewardId: reward.id,
        groupId: group.id,
        userId: userId,
        quantity: input.quantity,
        totalCost,
        status: "BOUGHT",
        remainingGroupCoins: updatedGroup.coins,
      };
    });
  }
}
