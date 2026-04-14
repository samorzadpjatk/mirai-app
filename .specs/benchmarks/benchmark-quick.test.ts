/**
 * Quick Performance Validation Test
 *
 * [UNIT] Quick validation that benchmarks execute without errors.
 * This is a lightweight version of the full benchmark suite.
 *
 * @module benchmarks/quick
 */

import { describe, it, expect } from "bun:test";
import { runBenchmark, compareBenchmarks } from "./utils";
import { Effect, Layer } from "effect";
import { User, UserRole } from "@mirai-app/domain";
import { InMemoryUserRepository } from "@mirai-app/adapters/gateways/in-memory";
import { UserRepositoryTag } from "@mirai-app/use-cases/ports/UserRepository";
import { GetUserUseCase } from "@mirai-app/use-cases/interactors/GetUser";

const QUICK_ITERATIONS = 10;

describe("[UNIT] Performance Validation - Quick Check", () => {
  it("should execute GetUser benchmark without errors", async () => {
    const repo = new InMemoryUserRepository();

    // Seed with test user
    const user = await Effect.runPromise(
      User.create({
        id: "test-user-123",
        authUserId: "auth-test-123",
        firstName: "Test",
        lastName: "User",
        role: UserRole.USER,
      }),
    );
    await Effect.runPromise(repo.create(user));

    const useCase = new GetUserUseCase();
    const repoLayer = Layer.succeed(UserRepositoryTag, repo);

    const result = await runBenchmark(
      "GetUser Quick",
      useCase
        .execute({ userId: "test-user-123" })
        .pipe(Effect.provide(repoLayer)),
      QUICK_ITERATIONS,
    );

    expect(result.iterations).toBe(QUICK_ITERATIONS);
    expect(result.avgTimeMs).toBeGreaterThan(0);
    expect(result.opsPerSecond).toBeGreaterThan(0);
  });

  it("should execute repository operation benchmarks without errors", async () => {
    const repo = new InMemoryUserRepository();

    // Seed with test user
    const user = await Effect.runPromise(
      User.create({
        id: "test-user-456",
        authUserId: "auth-test-456",
        firstName: "Test",
        lastName: "User",
        role: UserRole.USER,
      }),
    );
    await Effect.runPromise(repo.create(user));

    // Benchmark findById
    const findResult = await runBenchmark(
      "UserRepository.findById Quick",
      repo.findById("test-user-456"),
      QUICK_ITERATIONS,
    );

    expect(findResult.iterations).toBe(QUICK_ITERATIONS);
    expect(findResult.avgTimeMs).toBeGreaterThan(0);
  });

  it("should show performance is within acceptable range", async () => {
    const repo = new InMemoryUserRepository();

    // Seed with test user
    const user = await Effect.runPromise(
      User.create({
        id: "perf-test-user",
        authUserId: "auth-perf-test",
        firstName: "Perf",
        lastName: "Test",
        role: UserRole.USER,
      }),
    );
    await Effect.runPromise(repo.create(user));

    const useCase = new GetUserUseCase();
    const repoLayer = Layer.succeed(UserRepositoryTag, repo);

    const result = await runBenchmark(
      "Performance Check",
      useCase
        .execute({ userId: "perf-test-user" })
        .pipe(Effect.provide(repoLayer)),
      20,
    );

    // Performance should be reasonable (under 10ms avg for in-memory operation)
    expect(result.avgTimeMs).toBeLessThan(10);
    expect(result.opsPerSecond).toBeGreaterThan(100);
  });
});
