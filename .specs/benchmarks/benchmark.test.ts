/**
 * Performance Benchmark Tests
 *
 * [UNIT] Performance benchmarks for Effect-based implementations.
 * Validates that Effect-based operations meet performance criteria:
 * - Response times within ±10% of baseline (if available)
 * - All benchmarks execute without errors
 *
 * To run: bun test .specs/benchmarks/benchmark.test.ts
 * To run with specific iterations: ENABLE_TEST_LOGS=1 bun test .specs/benchmarks/benchmark.test.ts
 *
 * @module benchmarks
 */

import { describe, it, expect } from "bun:test";
import { runAllBenchmarks } from "./runner";
import { runUserBenchmarks } from "./user-operations";
import { runChallengeBenchmarks } from "./challenge-operations";

// Number of iterations for benchmarks (reduced for CI/test speed)
const ITERATIONS = process.env.CI ? 50 : 100;

describe("[UNIT] Performance Validation - Effect Framework", () => {
  describe("User Operations", () => {
    it("should execute GetUser benchmark without errors", async () => {
      const comparisons = await runUserBenchmarks(ITERATIONS);
      const getUserComparison = comparisons.find((c) =>
        c.name.includes("GetUser Use Case"),
      );

      expect(getUserComparison).toBeDefined();
      expect(getUserComparison!.effectResult.iterations).toBe(ITERATIONS);
      expect(getUserComparison!.effectResult.avgTimeMs).toBeGreaterThan(0);
      expect(getUserComparison!.effectResult.opsPerSecond).toBeGreaterThan(0);
    });

    it("should execute CreateUser benchmark without errors", async () => {
      const comparisons = await runUserBenchmarks(ITERATIONS);
      const createUserComparison = comparisons.find((c) =>
        c.name.includes("CreateUser Use Case"),
      );

      expect(createUserComparison).toBeDefined();
      expect(createUserComparison!.effectResult.iterations).toBe(ITERATIONS);
      expect(createUserComparison!.effectResult.avgTimeMs).toBeGreaterThan(0);
    });

    it("should execute UserRepository benchmarks without errors", async () => {
      const comparisons = await runUserBenchmarks(ITERATIONS);

      const findByIdComparison = comparisons.find((c) =>
        c.name.includes("UserRepository.findById"),
      );
      const existsComparison = comparisons.find((c) =>
        c.name.includes("UserRepository.existsByAuthUserId"),
      );

      expect(findByIdComparison).toBeDefined();
      expect(existsComparison).toBeDefined();
      expect(findByIdComparison!.effectResult.avgTimeMs).toBeGreaterThan(0);
      expect(existsComparison!.effectResult.avgTimeMs).toBeGreaterThan(0);
    });
  });

  describe("Challenge Operations", () => {
    it("should execute GetChallenge benchmark without errors", async () => {
      const comparisons = await runChallengeBenchmarks(ITERATIONS);
      const getChallengeComparison = comparisons.find((c) =>
        c.name.includes("GetChallenge Use Case"),
      );

      expect(getChallengeComparison).toBeDefined();
      expect(getChallengeComparison!.effectResult.iterations).toBe(ITERATIONS);
      expect(getChallengeComparison!.effectResult.avgTimeMs).toBeGreaterThan(0);
    });

    it("should execute CreateChallenge benchmark without errors", async () => {
      const comparisons = await runChallengeBenchmarks(ITERATIONS);
      const createChallengeComparison = comparisons.find((c) =>
        c.name.includes("CreateChallenge Use Case"),
      );

      expect(createChallengeComparison).toBeDefined();
      expect(createChallengeComparison!.effectResult.iterations).toBe(
        ITERATIONS,
      );
      expect(createChallengeComparison!.effectResult.avgTimeMs).toBeGreaterThan(
        0,
      );
    });

    it("should execute ChallengeRepository benchmarks without errors", async () => {
      const comparisons = await runChallengeBenchmarks(ITERATIONS);

      const findByIdComparison = comparisons.find((c) =>
        c.name.includes("ChallengeRepository.findById"),
      );
      const findByTripIdComparison = comparisons.find((c) =>
        c.name.includes("ChallengeRepository.findByTripId"),
      );
      const findActiveComparison = comparisons.find((c) =>
        c.name.includes("ChallengeRepository.findActive"),
      );

      expect(findByIdComparison).toBeDefined();
      expect(findByTripIdComparison).toBeDefined();
      expect(findActiveComparison).toBeDefined();
    });
  });

  describe("Performance Thresholds", () => {
    it("should have all benchmarks within acceptable performance range", async () => {
      const { allWithinThreshold, comparisons } = await runAllBenchmarks({
        iterations: ITERATIONS,
      });

      // Log results for debugging
      console.log("\nBenchmark Results:");
      for (const comparison of comparisons) {
        console.log(
          `  ${comparison.name}: ${comparison.effectResult.avgTimeMs.toFixed(3)}ms avg (${comparison.effectResult.opsPerSecond.toFixed(0)} ops/sec)`,
        );
        if (comparison.baselineResult) {
          console.log(
            `    vs baseline: ${comparison.percentDifference?.toFixed(1)}%`,
          );
        }
      }

      // All benchmarks should execute (we check this implicitly by reaching here)
      expect(comparisons.length).toBeGreaterThan(0);

      // If baselines exist, verify within ±10%
      const withBaselines = comparisons.filter((c) => c.baselineResult);
      for (const comparison of withBaselines) {
        expect(comparison.withinThreshold).toBe(true);
      }
    });

    it("should maintain consistent performance across multiple runs", async () => {
      // Run same benchmark twice and compare variance
      const run1 = await runUserBenchmarks(50); // Small iteration count for speed
      const run2 = await runUserBenchmarks(50);

      const getUser1 = run1.find((c) => c.name.includes("GetUser Use Case"))!;
      const getUser2 = run2.find((c) => c.name.includes("GetUser Use Case"))!;

      // Variance between runs should be less than 100% (allow for JIT warmup, GC, etc.)
      const variance =
        Math.abs(
          getUser1.effectResult.avgTimeMs - getUser2.effectResult.avgTimeMs,
        ) / getUser1.effectResult.avgTimeMs;

      expect(variance).toBeLessThan(1.0); // 100% variance threshold - allows for test environment variations
    });
  });

  describe("Benchmark Completeness", () => {
    it("should cover all critical operations", async () => {
      const { comparisons } = await runAllBenchmarks({
        iterations: ITERATIONS,
      });

      const testNames = comparisons.map((c) => c.name);

      // Verify all expected benchmarks are present
      expect(testNames).toContain("GetUser Use Case");
      expect(testNames).toContain("CreateUser Use Case");
      expect(testNames).toContain("GetChallenge Use Case");
      expect(testNames).toContain("CreateChallenge Use Case");
      expect(testNames).toContain("UserRepository.findById");
      expect(testNames).toContain("ChallengeRepository.findById");

      // Should have at least 10 benchmarks
      expect(comparisons.length).toBeGreaterThanOrEqual(10);
    });

    it("should generate valid performance metrics", async () => {
      const { comparisons } = await runAllBenchmarks({
        iterations: ITERATIONS,
      });

      for (const comparison of comparisons) {
        const result = comparison.effectResult;

        // All metrics should be valid numbers
        expect(result.iterations).toBeGreaterThan(0);
        expect(result.totalTimeMs).toBeGreaterThan(0);
        expect(result.avgTimeMs).toBeGreaterThan(0);
        expect(result.minTimeMs).toBeGreaterThanOrEqual(0);
        expect(result.maxTimeMs).toBeGreaterThan(result.minTimeMs);
        expect(result.opsPerSecond).toBeGreaterThan(0);
        expect(result.stdDevMs).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

// Run as test only - use runner.ts for standalone execution
