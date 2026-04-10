/**
 * Schema Build Verification Test
 *
 * Simple test to verify the GraphQL schema builds correctly.
 * This test avoids importing modules with broken dependencies.
 */

import { describe, it, expect } from "bun:test";

describe("[UNIT] GraphQL Schema Build", () => {
  it("should verify builder imports work", async () => {
    // Test that we can import the builder without errors
    const { builder } = await import("../builder");
    expect(builder).toBeDefined();
  });

  it("should verify User type imports work", async () => {
    // Test that User type registers without errors
    const userModule = await import("../types/User");
    expect(userModule).toBeDefined();
    expect(userModule.UserType).toBeDefined();
  });

  it("should verify error mapper imports work", async () => {
    // Test that error mapper exports work
    const errorMapper = await import("../utils/error-mapper");
    expect(errorMapper.handleResult).toBeDefined();
    expect(errorMapper.throwUnauthenticated).toBeDefined();
    expect(errorMapper.throwForbidden).toBeDefined();
    expect(errorMapper.throwNotFound).toBeDefined();
    expect(errorMapper.assertFound).toBeDefined();
    expect(errorMapper.assertAuthorized).toBeDefined();
  });

  it("should verify auth helpers imports work", async () => {
    // Test that auth helpers exports work
    const authHelpers = await import("../utils/auth-helpers");
    expect(authHelpers.requireAuth).toBeDefined();
    expect(authHelpers.requireAdmin).toBeDefined();
    expect(authHelpers.requireModerator).toBeDefined();
    expect(authHelpers.getOptionalAuth).toBeDefined();
    expect(authHelpers.isAuthenticated).toBeDefined();
    expect(authHelpers.getCurrentUserId).toBeDefined();
  });

  it("should verify User resolver imports work", async () => {
    // Test that User resolver imports without errors
    const userResolver = await import("../resolvers/User");
    expect(userResolver).toBeDefined();
  });

  it("should verify Query type imports work", async () => {
    // Test that Query type imports without errors
    const queryType = await import("../types/Query");
    expect(queryType).toBeDefined();
  });

  it("should verify ChallengeSubmission type imports work", async () => {
    // Test that ChallengeSubmission type registers without errors
    const challengeSubmissionModule =
      await import("../types/challengeSubmission");
    expect(challengeSubmissionModule).toBeDefined();
    expect(challengeSubmissionModule.ChallengeSubmissionType).toBeDefined();
  });

  it("should verify ChallengeSubmission resolver imports work", async () => {
    // Test that ChallengeSubmission resolver imports without errors
    const challengeSubmissionResolver =
      await import("../resolvers/challengeSubmission");
    expect(challengeSubmissionResolver).toBeDefined();
  });

  it("should build schema successfully", async () => {
    // Import all modules and build schema
    const { builder } = await import("../builder");
    await import("../types/User");
    await import("../resolvers/User");
    await import("../types/challengeSubmission");
    await import("../resolvers/challengeSubmission");
    await import("../types/Query");

    // Build schema
    const schema = builder.toSchema();
    expect(schema).toBeDefined();

    // Verify schema has expected types
    const typeMap = schema.getTypeMap();
    expect(typeMap.User).toBeDefined();
    expect(typeMap.ChallengeSubmission).toBeDefined();
    expect(typeMap.Query).toBeDefined();
    expect(typeMap.Mutation).toBeDefined();
  });
});
