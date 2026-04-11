/**
 * Challenge GraphQL Types Test
 *
 * Tests that challenge types are properly registered and resolvable.
 *
 * @module Challenge/tests
 */

import { describe, it, expect } from "bun:test";
import { schema } from "../schema";
import { printSchema } from "graphql";

describe("[UNIT] Challenge GraphQL Types", () => {
  it("should include Challenge type in schema", () => {
    const sdl = printSchema(schema);

    // Verify Challenge type exists
    expect(sdl).toContain("type Challenge");
    expect(sdl).toContain("type ChallengeSummary");
  });

  it("should include Challenge enums in schema", () => {
    const sdl = printSchema(schema);

    // Verify enum types exist
    expect(sdl).toContain("enum SubmissionType");
    expect(sdl).toContain("enum ScoringCategory");
    expect(sdl).toContain("enum ChallengeStatus");

    // Verify enum values
    expect(sdl).toContain("IMAGE");
    expect(sdl).toContain("MULTI_IMAGE");
    expect(sdl).toContain("SPEED");
    expect(sdl).toContain("PEER_VOTING");
    expect(sdl).toContain("ACTIVE");
    expect(sdl).toContain("CANCELLED");
  });

  it("should include Challenge query fields", () => {
    const sdl = printSchema(schema);

    // Verify query fields exist
    expect(sdl).toContain("challenges: [Challenge!]");
    expect(sdl).toContain("challengesByTrip(");
    expect(sdl).toContain("tripId: ID!");
    expect(sdl).toContain("challenge(");
    expect(sdl).toContain("id: ID!");
    expect(sdl).toContain("): Challenge");
  });

  it("should include Challenge mutation fields", () => {
    const sdl = printSchema(schema);

    // Verify mutation fields exist (multi-line format in printed schema)
    expect(sdl).toContain("createChallenge(");
    expect(sdl).toContain("input: CreateChallengeInput!");
    expect(sdl).toContain("): CreateChallengePayload");
    expect(sdl).toContain("updateChallenge(");
    expect(sdl).toContain("input: UpdateChallengeInput!");
    expect(sdl).toContain("): UpdateChallengePayload");
    expect(sdl).toContain("updateChallengeStatus(");
    expect(sdl).toContain("input: UpdateChallengeStatusInput!");
    expect(sdl).toContain("): UpdateChallengeStatusPayload");
    expect(sdl).toContain("deleteChallenge(");
    expect(sdl).toContain("id: ID!");
    expect(sdl).toContain("): DeleteChallengePayload");
  });

  it("should include Challenge input types", () => {
    const sdl = printSchema(schema);

    // Verify input types exist
    expect(sdl).toContain("input CreateChallengeInput");
    expect(sdl).toContain("input UpdateChallengeInput");
    expect(sdl).toContain("input UpdateChallengeStatusInput");
    expect(sdl).toContain("input PaginationInput");
  });

  it("should include Challenge payload types", () => {
    const sdl = printSchema(schema);

    // Verify payload types exist
    expect(sdl).toContain("type CreateChallengePayload");
    expect(sdl).toContain("type UpdateChallengePayload");
    expect(sdl).toContain("type UpdateChallengeStatusPayload");
    expect(sdl).toContain("type DeleteChallengePayload");
  });

  it("should include ChallengesConnection type", () => {
    const sdl = printSchema(schema);

    expect(sdl).toContain("type ChallengesConnection");
    expect(sdl).toContain("type ChallengePagination");
  });
});
