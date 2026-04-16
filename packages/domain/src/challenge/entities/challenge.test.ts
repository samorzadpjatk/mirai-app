import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { Challenge } from "./challenge";
import { ValidationError, StateTransitionError } from "../../system/errors";
import {
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "../../challenge/enums";

const validTripId = "trip-123";
const validName = "Test Challenge";
const validSubmissionType = SubmissionType.IMAGE;
const validScoringCategory = ScoringCategory.UNLIMITED;

const createMinimalProps = () => ({
  tripId: validTripId,
  name: validName,
  submissionType: validSubmissionType,
  scoringCategory: validScoringCategory,
});

const createValidChallenge = async (
  overrides: Partial<Parameters<typeof Challenge.create>[0]> = {},
): Promise<Challenge> => {
  const props = { ...createMinimalProps(), ...overrides };
  return Effect.runPromise(Challenge.create(props));
};

describe("[UNIT] Challenge", () => {
  describe("[UNIT] Challenge.create", () => {
    describe("creates entity with minimal props", () => {
      it("creates with tripId, name, submissionType, and scoringCategory", async () => {
        const challenge = await createValidChallenge();
        expect(challenge.tripId).toBe(validTripId);
        expect(challenge.name).toBe(validName);
        expect(challenge.submissionType).toBe(validSubmissionType);
        expect(challenge.scoringCategory).toBe(validScoringCategory);
      });

      it("generates UUID when id not provided", async () => {
        const challenge = await createValidChallenge();
        expect(challenge.id).toBeDefined();
        expect(challenge.id.length).toBeGreaterThan(0);
        expect(challenge.id).toContain("-");
      });

      it("uses provided id when specified", async () => {
        const customId = "custom-challenge-id";
        const challenge = await createValidChallenge({ id: customId });
        expect(challenge.id).toBe(customId);
      });

      it("defaults status to HIDDEN", async () => {
        const challenge = await createValidChallenge();
        expect(challenge.status).toBe(ChallengeStatus.HIDDEN);
      });

      it("defaults isRecurring to false", async () => {
        const challenge = await createValidChallenge();
        expect(challenge.isRecurring).toBe(false);
      });

      it("defaults autoApprove to false", async () => {
        const challenge = await createValidChallenge();
        expect(challenge.autoApprove).toBe(false);
      });

      it("defaults basePoints to 0", async () => {
        const challenge = await createValidChallenge();
        expect(challenge.basePoints).toBe(0);
      });

      it("sets description to null when not provided", async () => {
        const challenge = await createValidChallenge();
        expect(challenge.description).toBeNull();
      });

      it("sets image to null when not provided", async () => {
        const challenge = await createValidChallenge();
        expect(challenge.image).toBeNull();
      });

      it("sets dailyStartTime to null when not provided", async () => {
        const challenge = await createValidChallenge();
        expect(challenge.dailyStartTime).toBeNull();
      });

      it("sets dailyEndTime to null when not provided", async () => {
        const challenge = await createValidChallenge();
        expect(challenge.dailyEndTime).toBeNull();
      });

      it("sets startTime to null when not provided", async () => {
        const challenge = await createValidChallenge();
        expect(challenge.startTime).toBeNull();
      });

      it("sets endTime to null when not provided", async () => {
        const challenge = await createValidChallenge();
        expect(challenge.endTime).toBeNull();
      });

      it("sets votingStartTime to null when not provided", async () => {
        const challenge = await createValidChallenge();
        expect(challenge.votingStartTime).toBeNull();
      });

      it("sets votingEndTime to null when not provided", async () => {
        const challenge = await createValidChallenge();
        expect(challenge.votingEndTime).toBeNull();
      });

      it("sets targetLatitude to null when not provided", async () => {
        const challenge = await createValidChallenge();
        expect(challenge.targetLatitude).toBeNull();
      });

      it("sets targetLongitude to null when not provided", async () => {
        const challenge = await createValidChallenge();
        expect(challenge.targetLongitude).toBeNull();
      });

      it("sets expectedValue to null when not provided", async () => {
        const challenge = await createValidChallenge();
        expect(challenge.expectedValue).toBeNull();
      });

      it("sets place points to null when not provided", async () => {
        const challenge = await createValidChallenge();
        expect(challenge.firstPlacePoints).toBeNull();
        expect(challenge.secondPlacePoints).toBeNull();
        expect(challenge.thirdPlacePoints).toBeNull();
      });
    });

    describe("creates entity with all props", () => {
      it("creates with all optional fields populated", async () => {
        const now = new Date();
        const later = new Date(now.getTime() + 3600000);
        const props = {
          id: "full-challenge-id",
          tripId: validTripId,
          name: "Full Challenge",
          description: "A detailed description",
          image: "https://example.com/image.jpg",
          submissionType: SubmissionType.IMAGE_LOCATION,
          scoringCategory: ScoringCategory.JUDGED_STAFF,
          isRecurring: true,
          dailyStartTime: "09:00",
          dailyEndTime: "17:00",
          basePoints: 100,
          firstPlacePoints: 300,
          secondPlacePoints: 200,
          thirdPlacePoints: 150,
          status: ChallengeStatus.ACTIVE,
          startTime: now,
          endTime: later,
          votingStartTime: later,
          votingEndTime: new Date(later.getTime() + 3600000),
          targetLatitude: 52.2297,
          targetLongitude: 21.0122,
          expectedValue: "expected-qr-code",
          autoApprove: true,
          createdAt: now,
          updatedAt: now,
        };
        const challenge = await Effect.runPromise(Challenge.create(props));

        expect(challenge.id).toBe(props.id);
        expect(challenge.description).toBe(props.description);
        expect(challenge.image).toBe(props.image);
        expect(challenge.submissionType).toBe(props.submissionType);
        expect(challenge.scoringCategory).toBe(props.scoringCategory);
        expect(challenge.isRecurring).toBe(props.isRecurring);
        expect(challenge.dailyStartTime).toBe(props.dailyStartTime);
        expect(challenge.dailyEndTime).toBe(props.dailyEndTime);
        expect(challenge.basePoints).toBe(props.basePoints);
        expect(challenge.firstPlacePoints).toBe(props.firstPlacePoints);
        expect(challenge.secondPlacePoints).toBe(props.secondPlacePoints);
        expect(challenge.thirdPlacePoints).toBe(props.thirdPlacePoints);
        expect(challenge.status).toBe(props.status);
        expect(challenge.targetLatitude).toBe(props.targetLatitude);
        expect(challenge.targetLongitude).toBe(props.targetLongitude);
        expect(challenge.expectedValue).toBe(props.expectedValue);
        expect(challenge.autoApprove).toBe(props.autoApprove);
      });
    });

    describe("validation errors", () => {
      it("fails with ValidationError for empty tripId", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            Challenge.create({
              ...createMinimalProps(),
              tripId: "",
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("tripId");
        }
      });

      it("fails with ValidationError for empty name", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            Challenge.create({
              ...createMinimalProps(),
              name: "",
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("name");
        }
      });

      it("fails with ValidationError for name > 255 chars", async () => {
        const longName = "a".repeat(256);
        const result = await Effect.runPromise(
          Effect.either(
            Challenge.create({
              ...createMinimalProps(),
              name: longName,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("name");
        }
      });

      it("fails with ValidationError for description > 2000 chars", async () => {
        const longDescription = "a".repeat(2001);
        const result = await Effect.runPromise(
          Effect.either(
            Challenge.create({
              ...createMinimalProps(),
              description: longDescription,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("description");
        }
      });

      it("fails with ValidationError for invalid submissionType", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            Challenge.create({
              ...createMinimalProps(),
              submissionType: "INVALID_TYPE" as SubmissionType,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("submissionType");
        }
      });

      it("fails with ValidationError for invalid scoringCategory", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            Challenge.create({
              ...createMinimalProps(),
              scoringCategory: "INVALID_CATEGORY" as ScoringCategory,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("scoringCategory");
        }
      });

      it("fails with ValidationError for invalid status", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            Challenge.create({
              ...createMinimalProps(),
              status: "INVALID_STATUS" as ChallengeStatus,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("status");
        }
      });

      it("fails with ValidationError for negative basePoints", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            Challenge.create({
              ...createMinimalProps(),
              basePoints: -1,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("basePoints");
        }
      });

      it("fails with ValidationError for invalid dailyStartTime format", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            Challenge.create({
              ...createMinimalProps(),
              dailyStartTime: "invalid",
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("dailyStartTime");
        }
      });

      it("fails with ValidationError for invalid dailyEndTime format", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            Challenge.create({
              ...createMinimalProps(),
              dailyEndTime: "25:00",
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("dailyEndTime");
        }
      });

      it("fails with ValidationError when endTime < startTime", async () => {
        const now = new Date();
        const earlier = new Date(now.getTime() - 3600000);
        const result = await Effect.runPromise(
          Effect.either(
            Challenge.create({
              ...createMinimalProps(),
              startTime: now,
              endTime: earlier,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("endTime");
        }
      });

      it("fails with ValidationError when votingEndTime < votingStartTime", async () => {
        const now = new Date();
        const earlier = new Date(now.getTime() - 3600000);
        const result = await Effect.runPromise(
          Effect.either(
            Challenge.create({
              ...createMinimalProps(),
              votingStartTime: now,
              votingEndTime: earlier,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("votingEndTime");
        }
      });

      it("fails with ValidationError for expectedValue > 500 chars", async () => {
        const longValue = "a".repeat(501);
        const result = await Effect.runPromise(
          Effect.either(
            Challenge.create({
              ...createMinimalProps(),
              expectedValue: longValue,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("expectedValue");
        }
      });

      it("fails with ValidationError for image URL > 1000 chars", async () => {
        const longUrl = "https://example.com/" + "a".repeat(990);
        const result = await Effect.runPromise(
          Effect.either(
            Challenge.create({
              ...createMinimalProps(),
              image: longUrl,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("image");
        }
      });
    });
  });

  describe("[UNIT] state machine transitions", () => {
    describe("valid transitions", () => {
      it("HIDDEN -> VISIBLE succeeds", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.HIDDEN,
        });
        const visible = await Effect.runPromise(challenge.makeVisible());
        expect(visible.status).toBe(ChallengeStatus.VISIBLE);
        expect(visible.isVisible()).toBe(true);
      });

      it("HIDDEN -> CANCELLED succeeds", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.HIDDEN,
        });
        const cancelled = await Effect.runPromise(challenge.cancel());
        expect(cancelled.status).toBe(ChallengeStatus.CANCELLED);
        expect(cancelled.isCancelled()).toBe(true);
      });

      it("VISIBLE -> ACTIVE succeeds", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.VISIBLE,
        });
        const active = await Effect.runPromise(challenge.activate());
        expect(active.status).toBe(ChallengeStatus.ACTIVE);
        expect(active.isActive()).toBe(true);
      });

      it("VISIBLE -> CANCELLED succeeds", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.VISIBLE,
        });
        const cancelled = await Effect.runPromise(challenge.cancel());
        expect(cancelled.status).toBe(ChallengeStatus.CANCELLED);
      });

      it("ACTIVE -> VOTING_PHASE succeeds", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.ACTIVE,
        });
        const voting = await Effect.runPromise(challenge.startVoting());
        expect(voting.status).toBe(ChallengeStatus.VOTING_PHASE);
        expect(voting.isInVotingPhase()).toBe(true);
      });

      it("ACTIVE -> COMPLETED succeeds", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.ACTIVE,
        });
        const completed = await Effect.runPromise(challenge.complete());
        expect(completed.status).toBe(ChallengeStatus.COMPLETED);
        expect(completed.isCompleted()).toBe(true);
      });

      it("ACTIVE -> CANCELLED succeeds", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.ACTIVE,
        });
        const cancelled = await Effect.runPromise(challenge.cancel());
        expect(cancelled.status).toBe(ChallengeStatus.CANCELLED);
      });

      it("VOTING_PHASE -> COMPLETED succeeds", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.VOTING_PHASE,
        });
        const completed = await Effect.runPromise(challenge.complete());
        expect(completed.status).toBe(ChallengeStatus.COMPLETED);
      });

      it("VOTING_PHASE -> CANCELLED succeeds", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.VOTING_PHASE,
        });
        const cancelled = await Effect.runPromise(challenge.cancel());
        expect(cancelled.status).toBe(ChallengeStatus.CANCELLED);
      });
    });

    describe("invalid transitions", () => {
      it("VISIBLE -> HIDDEN fails", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.VISIBLE,
        });
        const result = await Effect.runPromise(
          Effect.either(challenge.transitionStatus(ChallengeStatus.HIDDEN)),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StateTransitionError);
        }
      });

      it("ACTIVE -> HIDDEN fails", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.ACTIVE,
        });
        const result = await Effect.runPromise(
          Effect.either(challenge.transitionStatus(ChallengeStatus.HIDDEN)),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StateTransitionError);
        }
      });

      it("ACTIVE -> VISIBLE fails", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.ACTIVE,
        });
        const result = await Effect.runPromise(
          Effect.either(challenge.transitionStatus(ChallengeStatus.VISIBLE)),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StateTransitionError);
        }
      });

      it("VOTING_PHASE -> HIDDEN fails", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.VOTING_PHASE,
        });
        const result = await Effect.runPromise(
          Effect.either(challenge.transitionStatus(ChallengeStatus.HIDDEN)),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StateTransitionError);
        }
      });

      it("VOTING_PHASE -> VISIBLE fails", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.VOTING_PHASE,
        });
        const result = await Effect.runPromise(
          Effect.either(challenge.transitionStatus(ChallengeStatus.VISIBLE)),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StateTransitionError);
        }
      });

      it("VOTING_PHASE -> ACTIVE fails", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.VOTING_PHASE,
        });
        const result = await Effect.runPromise(
          Effect.either(challenge.transitionStatus(ChallengeStatus.ACTIVE)),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StateTransitionError);
        }
      });

      it("COMPLETED -> any state fails", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.COMPLETED,
        });
        const transitions = [
          ChallengeStatus.HIDDEN,
          ChallengeStatus.VISIBLE,
          ChallengeStatus.ACTIVE,
          ChallengeStatus.VOTING_PHASE,
          ChallengeStatus.CANCELLED,
        ];
        for (const toStatus of transitions) {
          const result = await Effect.runPromise(
            Effect.either(challenge.transitionStatus(toStatus)),
          );
          expect(result._tag).toBe("Left");
          if (result._tag === "Left") {
            expect(result.left).toBeInstanceOf(StateTransitionError);
          }
        }
      });

      it("CANCELLED -> any state fails", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.CANCELLED,
        });
        const transitions = [
          ChallengeStatus.HIDDEN,
          ChallengeStatus.VISIBLE,
          ChallengeStatus.ACTIVE,
          ChallengeStatus.VOTING_PHASE,
          ChallengeStatus.COMPLETED,
        ];
        for (const toStatus of transitions) {
          const result = await Effect.runPromise(
            Effect.either(challenge.transitionStatus(toStatus)),
          );
          expect(result._tag).toBe("Left");
          if (result._tag === "Left") {
            expect(result.left).toBeInstanceOf(StateTransitionError);
          }
        }
      });

      it("HIDDEN -> HIDDEN (self-transition) fails", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.HIDDEN,
        });
        const result = await Effect.runPromise(
          Effect.either(challenge.transitionStatus(ChallengeStatus.HIDDEN)),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StateTransitionError);
        }
      });
    });

    describe("StateTransitionError contains correct info", () => {
      it("error includes from, to, and entityType", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.COMPLETED,
        });
        const result = await Effect.runPromise(
          Effect.either(challenge.activate()),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StateTransitionError);
          expect(result.left.from).toBe(ChallengeStatus.COMPLETED);
          expect(result.left.to).toBe(ChallengeStatus.ACTIVE);
          expect(result.left.entityType).toBe("Challenge");
          expect(result.left.message).toContain("Cannot transition");
        }
      });
    });
  });

  describe("[UNIT] status check methods", () => {
    it("isHidden returns true when status is HIDDEN", async () => {
      const challenge = await createValidChallenge({
        status: ChallengeStatus.HIDDEN,
      });
      expect(challenge.isHidden()).toBe(true);
      expect(challenge.isVisible()).toBe(false);
      expect(challenge.isActive()).toBe(false);
    });

    it("isVisible returns true when status is VISIBLE", async () => {
      const challenge = await createValidChallenge({
        status: ChallengeStatus.VISIBLE,
      });
      expect(challenge.isVisible()).toBe(true);
      expect(challenge.isHidden()).toBe(false);
      expect(challenge.isActive()).toBe(false);
    });

    it("isActive returns true when status is ACTIVE", async () => {
      const challenge = await createValidChallenge({
        status: ChallengeStatus.ACTIVE,
      });
      expect(challenge.isActive()).toBe(true);
      expect(challenge.isHidden()).toBe(false);
      expect(challenge.isVisible()).toBe(false);
    });

    it("isInVotingPhase returns true when status is VOTING_PHASE", async () => {
      const challenge = await createValidChallenge({
        status: ChallengeStatus.VOTING_PHASE,
      });
      expect(challenge.isInVotingPhase()).toBe(true);
      expect(challenge.isActive()).toBe(false);
    });

    it("isCompleted returns true when status is COMPLETED", async () => {
      const challenge = await createValidChallenge({
        status: ChallengeStatus.COMPLETED,
      });
      expect(challenge.isCompleted()).toBe(true);
      expect(challenge.isCancelled()).toBe(false);
    });

    it("isCancelled returns true when status is CANCELLED", async () => {
      const challenge = await createValidChallenge({
        status: ChallengeStatus.CANCELLED,
      });
      expect(challenge.isCancelled()).toBe(true);
      expect(challenge.isCompleted()).toBe(false);
    });

    it("isTerminal returns true for COMPLETED", async () => {
      const challenge = await createValidChallenge({
        status: ChallengeStatus.COMPLETED,
      });
      expect(challenge.isTerminal()).toBe(true);
    });

    it("isTerminal returns true for CANCELLED", async () => {
      const challenge = await createValidChallenge({
        status: ChallengeStatus.CANCELLED,
      });
      expect(challenge.isTerminal()).toBe(true);
    });

    it("isTerminal returns false for non-terminal states", async () => {
      const nonTerminalStatuses = [
        ChallengeStatus.HIDDEN,
        ChallengeStatus.VISIBLE,
        ChallengeStatus.ACTIVE,
        ChallengeStatus.VOTING_PHASE,
      ];
      for (const status of nonTerminalStatuses) {
        const challenge = await createValidChallenge({ status });
        expect(challenge.isTerminal()).toBe(false);
      }
    });
  });

  describe("[UNIT] business logic queries", () => {
    describe("canAcceptSubmissions", () => {
      it("returns true when status is ACTIVE", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.ACTIVE,
        });
        expect(challenge.canAcceptSubmissions()).toBe(true);
      });

      it("returns false when status is HIDDEN", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.HIDDEN,
        });
        expect(challenge.canAcceptSubmissions()).toBe(false);
      });

      it("returns false when status is VISIBLE", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.VISIBLE,
        });
        expect(challenge.canAcceptSubmissions()).toBe(false);
      });

      it("returns false when status is VOTING_PHASE", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.VOTING_PHASE,
        });
        expect(challenge.canAcceptSubmissions()).toBe(false);
      });

      it("returns false when status is COMPLETED", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.COMPLETED,
        });
        expect(challenge.canAcceptSubmissions()).toBe(false);
      });

      it("returns false when status is CANCELLED", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.CANCELLED,
        });
        expect(challenge.canAcceptSubmissions()).toBe(false);
      });
    });

    describe("canAcceptVotes", () => {
      it("returns true when status is VOTING_PHASE", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.VOTING_PHASE,
        });
        expect(challenge.canAcceptVotes()).toBe(true);
      });

      it("returns false when status is HIDDEN", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.HIDDEN,
        });
        expect(challenge.canAcceptVotes()).toBe(false);
      });

      it("returns false when status is VISIBLE", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.VISIBLE,
        });
        expect(challenge.canAcceptVotes()).toBe(false);
      });

      it("returns false when status is ACTIVE", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.ACTIVE,
        });
        expect(challenge.canAcceptVotes()).toBe(false);
      });

      it("returns false when status is COMPLETED", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.COMPLETED,
        });
        expect(challenge.canAcceptVotes()).toBe(false);
      });

      it("returns false when status is CANCELLED", async () => {
        const challenge = await createValidChallenge({
          status: ChallengeStatus.CANCELLED,
        });
        expect(challenge.canAcceptVotes()).toBe(false);
      });
    });

    describe("hasLocationTarget", () => {
      it("returns true when both latitude and longitude are set", async () => {
        const challenge = await createValidChallenge({
          targetLatitude: 52.2297,
          targetLongitude: 21.0122,
        });
        expect(challenge.hasLocationTarget()).toBe(true);
      });

      it("returns false when only latitude is set", async () => {
        const challenge = await createValidChallenge({
          targetLatitude: 52.2297,
        });
        expect(challenge.hasLocationTarget()).toBe(false);
      });

      it("returns false when only longitude is set", async () => {
        const challenge = await createValidChallenge({
          targetLongitude: 21.0122,
        });
        expect(challenge.hasLocationTarget()).toBe(false);
      });

      it("returns false when neither is set", async () => {
        const challenge = await createValidChallenge();
        expect(challenge.hasLocationTarget()).toBe(false);
      });
    });

    describe("hasExpectedValue", () => {
      it("returns true when expectedValue is set", async () => {
        const challenge = await createValidChallenge({
          expectedValue: "expected-qr-code",
        });
        expect(challenge.hasExpectedValue()).toBe(true);
      });

      it("returns false when expectedValue is null", async () => {
        const challenge = await createValidChallenge({
          expectedValue: null,
        });
        expect(challenge.hasExpectedValue()).toBe(false);
      });

      it("returns false when expectedValue is empty string", async () => {
        const challenge = await createValidChallenge({
          expectedValue: "",
        });
        expect(challenge.hasExpectedValue()).toBe(false);
      });
    });

    describe("requiresLocation", () => {
      it("returns true for LOCATION submission type", async () => {
        const challenge = await createValidChallenge({
          submissionType: SubmissionType.LOCATION,
        });
        expect(challenge.requiresLocation()).toBe(true);
      });

      it("returns true for IMAGE_LOCATION submission type", async () => {
        const challenge = await createValidChallenge({
          submissionType: SubmissionType.IMAGE_LOCATION,
        });
        expect(challenge.requiresLocation()).toBe(true);
      });

      it("returns false for IMAGE submission type", async () => {
        const challenge = await createValidChallenge({
          submissionType: SubmissionType.IMAGE,
        });
        expect(challenge.requiresLocation()).toBe(false);
      });

      it("returns false for TEXT submission type", async () => {
        const challenge = await createValidChallenge({
          submissionType: SubmissionType.TEXT,
        });
        expect(challenge.requiresLocation()).toBe(false);
      });

      it("returns false for QR_CODE submission type", async () => {
        const challenge = await createValidChallenge({
          submissionType: SubmissionType.QR_CODE,
        });
        expect(challenge.requiresLocation()).toBe(false);
      });

      it("returns false for VIDEO submission type", async () => {
        const challenge = await createValidChallenge({
          submissionType: SubmissionType.VIDEO,
        });
        expect(challenge.requiresLocation()).toBe(false);
      });

      it("returns false for MULTI_IMAGE submission type", async () => {
        const challenge = await createValidChallenge({
          submissionType: SubmissionType.MULTI_IMAGE,
        });
        expect(challenge.requiresLocation()).toBe(false);
      });
    });

    describe("isDailyChallenge", () => {
      it("returns true when isRecurring is true", async () => {
        const challenge = await createValidChallenge({
          isRecurring: true,
        });
        expect(challenge.isDailyChallenge()).toBe(true);
      });

      it("returns false when isRecurring is false", async () => {
        const challenge = await createValidChallenge({
          isRecurring: false,
        });
        expect(challenge.isDailyChallenge()).toBe(false);
      });
    });
  });

  describe("[UNIT] points calculation", () => {
    it("getPointsForRanking(1) returns firstPlacePoints when set", async () => {
      const challenge = await createValidChallenge({
        basePoints: 10,
        firstPlacePoints: 100,
      });
      expect(challenge.getPointsForRanking(1)).toBe(100);
    });

    it("getPointsForRanking(1) returns basePoints when firstPlacePoints is null", async () => {
      const challenge = await createValidChallenge({
        basePoints: 10,
        firstPlacePoints: null,
      });
      expect(challenge.getPointsForRanking(1)).toBe(10);
    });

    it("getPointsForRanking(2) returns secondPlacePoints when set", async () => {
      const challenge = await createValidChallenge({
        basePoints: 10,
        secondPlacePoints: 50,
      });
      expect(challenge.getPointsForRanking(2)).toBe(50);
    });

    it("getPointsForRanking(2) returns basePoints when secondPlacePoints is null", async () => {
      const challenge = await createValidChallenge({
        basePoints: 10,
        secondPlacePoints: null,
      });
      expect(challenge.getPointsForRanking(2)).toBe(10);
    });

    it("getPointsForRanking(3) returns thirdPlacePoints when set", async () => {
      const challenge = await createValidChallenge({
        basePoints: 10,
        thirdPlacePoints: 25,
      });
      expect(challenge.getPointsForRanking(3)).toBe(25);
    });

    it("getPointsForRanking(3) returns basePoints when thirdPlacePoints is null", async () => {
      const challenge = await createValidChallenge({
        basePoints: 10,
        thirdPlacePoints: null,
      });
      expect(challenge.getPointsForRanking(3)).toBe(10);
    });

    it("getPointsForRanking(4+) returns basePoints", async () => {
      const challenge = await createValidChallenge({
        basePoints: 10,
      });
      expect(challenge.getPointsForRanking(4)).toBe(10);
      expect(challenge.getPointsForRanking(5)).toBe(10);
      expect(challenge.getPointsForRanking(100)).toBe(10);
    });

    it("getPointsForRanking(0) returns basePoints", async () => {
      const challenge = await createValidChallenge({
        basePoints: 10,
      });
      expect(challenge.getPointsForRanking(0)).toBe(10);
    });

    it("getPointsForRanking(-1) returns basePoints", async () => {
      const challenge = await createValidChallenge({
        basePoints: 10,
      });
      expect(challenge.getPointsForRanking(-1)).toBe(10);
    });
  });

  describe("[UNIT] update method", () => {
    it("updates name successfully", async () => {
      const challenge = await createValidChallenge({ name: "Original Name" });
      const updated = await Effect.runPromise(
        challenge.update({ name: "Updated Name" }),
      );
      expect(updated.name).toBe("Updated Name");
      expect(updated.id).toBe(challenge.id);
    });

    it("updates description successfully", async () => {
      const challenge = await createValidChallenge();
      const updated = await Effect.runPromise(
        challenge.update({ description: "New description" }),
      );
      expect(updated.description).toBe("New description");
    });

    it("sets description to null when provided as null", async () => {
      const challenge = await createValidChallenge({
        description: "Original description",
      });
      const updated = await Effect.runPromise(
        challenge.update({ description: null }),
      );
      expect(updated.description).toBeNull();
    });

    it("updates image successfully", async () => {
      const challenge = await createValidChallenge();
      const updated = await Effect.runPromise(
        challenge.update({ image: "https://example.com/new.jpg" }),
      );
      expect(updated.image).toBe("https://example.com/new.jpg");
    });

    it("sets image to null when provided as null", async () => {
      const challenge = await createValidChallenge({
        image: "https://example.com/old.jpg",
      });
      const updated = await Effect.runPromise(
        challenge.update({ image: null }),
      );
      expect(updated.image).toBeNull();
    });

    it("updates basePoints successfully", async () => {
      const challenge = await createValidChallenge({ basePoints: 10 });
      const updated = await Effect.runPromise(
        challenge.update({ basePoints: 50 }),
      );
      expect(updated.basePoints).toBe(50);
    });

    it("fails with ValidationError for negative basePoints in update", async () => {
      const challenge = await createValidChallenge();
      const result = await Effect.runPromise(
        Effect.either(challenge.update({ basePoints: -5 })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("basePoints");
      }
    });

    it("fails with ValidationError for empty name in update", async () => {
      const challenge = await createValidChallenge();
      const result = await Effect.runPromise(
        Effect.either(challenge.update({ name: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("name");
      }
    });

    it("fails with ValidationError for name > 255 chars in update", async () => {
      const challenge = await createValidChallenge();
      const longName = "a".repeat(256);
      const result = await Effect.runPromise(
        Effect.either(challenge.update({ name: longName })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("name");
      }
    });

    it("fails with ValidationError when endTime < startTime in update", async () => {
      const now = new Date();
      const earlier = new Date(now.getTime() - 3600000);
      const challenge = await createValidChallenge();
      const result = await Effect.runPromise(
        Effect.either(
          challenge.update({
            startTime: now,
            endTime: earlier,
          }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("endTime");
      }
    });

    it("fails with ValidationError when votingEndTime < votingStartTime in update", async () => {
      const now = new Date();
      const earlier = new Date(now.getTime() - 3600000);
      const challenge = await createValidChallenge();
      const result = await Effect.runPromise(
        Effect.either(
          challenge.update({
            votingStartTime: now,
            votingEndTime: earlier,
          }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("votingEndTime");
      }
    });

    it("updates firstPlacePoints successfully", async () => {
      const challenge = await createValidChallenge();
      const updated = await Effect.runPromise(
        challenge.update({ firstPlacePoints: 100 }),
      );
      expect(updated.firstPlacePoints).toBe(100);
    });

    it("updates secondPlacePoints successfully", async () => {
      const challenge = await createValidChallenge();
      const updated = await Effect.runPromise(
        challenge.update({ secondPlacePoints: 50 }),
      );
      expect(updated.secondPlacePoints).toBe(50);
    });

    it("updates thirdPlacePoints successfully", async () => {
      const challenge = await createValidChallenge();
      const updated = await Effect.runPromise(
        challenge.update({ thirdPlacePoints: 25 }),
      );
      expect(updated.thirdPlacePoints).toBe(25);
    });

    it("updates location coordinates successfully", async () => {
      const challenge = await createValidChallenge();
      const updated = await Effect.runPromise(
        challenge.update({
          targetLatitude: 40.7128,
          targetLongitude: -74.006,
        }),
      );
      expect(updated.targetLatitude).toBe(40.7128);
      expect(updated.targetLongitude).toBe(-74.006);
    });

    it("updates expectedValue successfully", async () => {
      const challenge = await createValidChallenge();
      const updated = await Effect.runPromise(
        challenge.update({ expectedValue: "new-expected-value" }),
      );
      expect(updated.expectedValue).toBe("new-expected-value");
    });

    it("sets expectedValue to null when provided as null", async () => {
      const challenge = await createValidChallenge({
        expectedValue: "original-value",
      });
      const updated = await Effect.runPromise(
        challenge.update({ expectedValue: null }),
      );
      expect(updated.expectedValue).toBeNull();
    });

    it("updates autoApprove successfully", async () => {
      const challenge = await createValidChallenge({ autoApprove: false });
      const updated = await Effect.runPromise(
        challenge.update({ autoApprove: true }),
      );
      expect(updated.autoApprove).toBe(true);
    });

    it("returns new instance with updated updatedAt", async () => {
      const challenge = await createValidChallenge();
      const originalUpdatedAt = challenge.updatedAt;
      await new Promise((resolve) => setTimeout(resolve, 10));
      const updated = await Effect.runPromise(
        challenge.update({ name: "Updated" }),
      );
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it("preserves unchanged properties", async () => {
      const challenge = await createValidChallenge({
        name: "Original",
        basePoints: 100,
        description: "Original desc",
      });
      const updated = await Effect.runPromise(
        challenge.update({ name: "Updated" }),
      );
      expect(updated.name).toBe("Updated");
      expect(updated.basePoints).toBe(100);
      expect(updated.description).toBe("Original desc");
    });
  });

  describe("[UNIT] immutability", () => {
    it("create returns new instances", async () => {
      const challenge1 = await createValidChallenge({ id: "id-1" });
      const challenge2 = await createValidChallenge({ id: "id-2" });
      expect(challenge1).not.toBe(challenge2);
      expect(challenge1.id).not.toBe(challenge2.id);
    });

    it("transitionStatus returns new instance", async () => {
      const challenge = await createValidChallenge({
        status: ChallengeStatus.HIDDEN,
      });
      const transitioned = await Effect.runPromise(challenge.makeVisible());
      expect(transitioned).not.toBe(challenge);
      expect(challenge.status).toBe(ChallengeStatus.HIDDEN);
    });

    it("update returns new instance", async () => {
      const challenge = await createValidChallenge({ name: "Original" });
      const updated = await Effect.runPromise(
        challenge.update({ name: "Updated" }),
      );
      expect(updated).not.toBe(challenge);
      expect(challenge.name).toBe("Original");
    });
  });

  describe("[UNIT] edge cases", () => {
    it("accepts name exactly 255 characters", async () => {
      const name = "a".repeat(255);
      const challenge = await createValidChallenge({ name });
      expect(challenge.name).toBe(name);
    });

    it("accepts description exactly 2000 characters", async () => {
      const description = "a".repeat(2000);
      const challenge = await createValidChallenge({ description });
      expect(challenge.description).toBe(description);
    });

    it("accepts expectedValue exactly 500 characters", async () => {
      const expectedValue = "a".repeat(500);
      const challenge = await createValidChallenge({ expectedValue });
      expect(challenge.expectedValue).toBe(expectedValue);
    });

    it("accepts image URL exactly 1000 characters", async () => {
      const image = "https://example.com/" + "a".repeat(978);
      const challenge = await createValidChallenge({ image });
      expect(challenge.image).toBe(image);
    });

    it("accepts valid daily time formats", async () => {
      const times = ["00:00", "09:00", "17:30", "23:59"];
      for (const time of times) {
        const challenge = await createValidChallenge({
          dailyStartTime: time,
        });
        expect(challenge.dailyStartTime).toBe(time);
      }
    });

    it("accepts zero basePoints", async () => {
      const challenge = await createValidChallenge({ basePoints: 0 });
      expect(challenge.basePoints).toBe(0);
    });

    it("accepts large positive basePoints", async () => {
      const challenge = await createValidChallenge({ basePoints: 10000 });
      expect(challenge.basePoints).toBe(10000);
    });

    it("preserves createdAt during updates", async () => {
      const createdAt = new Date("2024-01-01");
      const challenge = await createValidChallenge({ createdAt });
      const updated = await Effect.runPromise(
        challenge.update({ name: "Updated" }),
      );
      expect(updated.createdAt).toBe(createdAt);
    });

    it("accepts all valid SubmissionTypes", async () => {
      const types = [
        SubmissionType.IMAGE,
        SubmissionType.MULTI_IMAGE,
        SubmissionType.VIDEO,
        SubmissionType.TEXT,
        SubmissionType.IMAGE_LOCATION,
        SubmissionType.LOCATION,
        SubmissionType.QR_CODE,
      ];
      for (const type of types) {
        const challenge = await createValidChallenge({ submissionType: type });
        expect(challenge.submissionType).toBe(type);
      }
    });

    it("accepts all valid ScoringCategories", async () => {
      const categories = [
        ScoringCategory.SPEED,
        ScoringCategory.UNLIMITED,
        ScoringCategory.JUDGED_STAFF,
        ScoringCategory.PEER_VOTING,
      ];
      for (const category of categories) {
        const challenge = await createValidChallenge({
          scoringCategory: category,
        });
        expect(challenge.scoringCategory).toBe(category);
      }
    });

    it("accepts all valid ChallengeStatuses", async () => {
      const statuses = [
        ChallengeStatus.HIDDEN,
        ChallengeStatus.VISIBLE,
        ChallengeStatus.ACTIVE,
        ChallengeStatus.VOTING_PHASE,
        ChallengeStatus.COMPLETED,
        ChallengeStatus.CANCELLED,
      ];
      for (const status of statuses) {
        const challenge = await createValidChallenge({ status });
        expect(challenge.status).toBe(status);
      }
    });

    it("allows equal start and end times", async () => {
      const now = new Date();
      const challenge = await createValidChallenge({
        startTime: now,
        endTime: now,
      });
      expect(challenge.startTime).toBe(now);
      expect(challenge.endTime).toBe(now);
    });

    it("allows equal voting start and end times", async () => {
      const now = new Date();
      const challenge = await createValidChallenge({
        votingStartTime: now,
        votingEndTime: now,
      });
      expect(challenge.votingStartTime).toBe(now);
      expect(challenge.votingEndTime).toBe(now);
    });

    it("allows null description and expectedValue in update", async () => {
      const challenge = await createValidChallenge({
        description: "desc",
        expectedValue: "value",
      });
      const updated = await Effect.runPromise(
        challenge.update({
          description: null,
          expectedValue: null,
        }),
      );
      expect(updated.description).toBeNull();
      expect(updated.expectedValue).toBeNull();
    });
  });
});
