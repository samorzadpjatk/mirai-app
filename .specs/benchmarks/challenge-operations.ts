/**
 * Challenge Operations Benchmark
 *
 * Performance benchmarks for Effect-based challenge operations.
 * Tests GetChallenge and CreateChallenge use cases.
 *
 * @module .specs/benchmarks/challenge-operations
 */

import { Effect, Layer } from "effect";
import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";
import { InMemoryChallengeRepository } from "@mirai-app/adapters/gateways/in-memory";
import { ChallengeRepositoryTag } from "@mirai-app/use-cases/ports/ChallengeRepository";
import {
  getChallengeUseCase,
  GetChallengeInput,
} from "@mirai-app/use-cases/interactors/GetChallenge";
import {
  createChallengeUseCase,
  CreateChallengeInput,
} from "@mirai-app/use-cases/interactors/CreateChallenge";
import {
  runBenchmark,
  type BenchmarkResult,
  type BenchmarkComparison,
  compareBenchmarks,
} from "./utils";

// Test data
const TEST_CHALLENGE_DATA = {
  id: "test-challenge-123",
  tripId: "trip-123",
  name: "Test Challenge",
  description: "A test challenge",
  image: null,
  submissionType: SubmissionType.PHOTO,
  scoringCategory: ScoringCategory.PHOTO,
  isRecurring: false,
  dailyStartTime: null,
  dailyEndTime: null,
  basePoints: 100,
  firstPlacePoints: null,
  secondPlacePoints: null,
  thirdPlacePoints: null,
  status: ChallengeStatus.DRAFT,
  startTime: null,
  endTime: null,
  votingStartTime: null,
  votingEndTime: null,
  targetLatitude: null,
  targetLongitude: null,
  expectedValue: null,
  autoApprove: false,
};

const CREATE_CHALLENGE_INPUT: CreateChallengeInput = {
  tripId: "trip-new",
  name: "New Challenge",
  description: "A new challenge",
  submissionType: SubmissionType.TEXT,
  scoringCategory: ScoringCategory.CREATIVE,
  basePoints: 50,
  status: ChallengeStatus.DRAFT,
};

/**
 * Setup in-memory repository
 */
function setupRepository(): InMemoryChallengeRepository {
  return new InMemoryChallengeRepository();
}

/**
 * Seed repository with test challenge
 * Returns the ID of the created challenge
 */
async function seedChallenge(
  repo: InMemoryChallengeRepository,
  customId?: string,
): Promise<string> {
  const challenge = await Effect.runPromise(
    Challenge.create({
      id: customId,
      tripId: TEST_CHALLENGE_DATA.tripId,
      name: TEST_CHALLENGE_DATA.name,
      description: TEST_CHALLENGE_DATA.description,
      image: TEST_CHALLENGE_DATA.image,
      submissionType: TEST_CHALLENGE_DATA.submissionType,
      scoringCategory: TEST_CHALLENGE_DATA.scoringCategory,
      isRecurring: TEST_CHALLENGE_DATA.isRecurring,
      dailyStartTime: TEST_CHALLENGE_DATA.dailyStartTime,
      dailyEndTime: TEST_CHALLENGE_DATA.dailyEndTime,
      basePoints: TEST_CHALLENGE_DATA.basePoints,
      firstPlacePoints: TEST_CHALLENGE_DATA.firstPlacePoints,
      secondPlacePoints: TEST_CHALLENGE_DATA.secondPlacePoints,
      thirdPlacePoints: TEST_CHALLENGE_DATA.thirdPlacePoints,
      status: TEST_CHALLENGE_DATA.status,
      startTime: TEST_CHALLENGE_DATA.startTime,
      endTime: TEST_CHALLENGE_DATA.endTime,
      votingStartTime: TEST_CHALLENGE_DATA.votingStartTime,
      votingEndTime: TEST_CHALLENGE_DATA.votingEndTime,
      targetLatitude: TEST_CHALLENGE_DATA.targetLatitude,
      targetLongitude: TEST_CHALLENGE_DATA.targetLongitude,
      expectedValue: TEST_CHALLENGE_DATA.expectedValue,
      autoApprove: TEST_CHALLENGE_DATA.autoApprove,
    }),
  );
  const saved = await Effect.runPromise(repo.create(challenge));
  return saved.id;
}

/**
 * Benchmark GetChallenge use case
 */
async function benchmarkGetChallenge(
  iterations: number = 1000,
): Promise<BenchmarkResult> {
  const repo = setupRepository();
  const challengeId = await seedChallenge(repo, "test-challenge-123");

  const repoLayer = Layer.succeed(ChallengeRepositoryTag, repo);

  const input: GetChallengeInput = { challengeId };

  return runBenchmark(
    "GetChallenge",
    getChallengeUseCase(input).pipe(Effect.provide(repoLayer)),
    iterations,
  );
}

/**
 * Benchmark CreateChallenge use case
 */
async function benchmarkCreateChallenge(
  iterations: number = 1000,
): Promise<BenchmarkResult> {
  return runBenchmark(
    "CreateChallenge",
    Effect.gen(function* () {
      const repo = new InMemoryChallengeRepository();
      const repoLayer = Layer.succeed(ChallengeRepositoryTag, repo);

      const uniqueInput: CreateChallengeInput = {
        ...CREATE_CHALLENGE_INPUT,
        name: `${CREATE_CHALLENGE_INPUT.name}-${Date.now()}-${Math.random()}`,
      };

      return yield* createChallengeUseCase(uniqueInput).pipe(
        Effect.provide(repoLayer),
      );
    }),
    iterations,
  );
}

/**
 * Benchmark ChallengeRepository.findById
 */
async function benchmarkRepoFindById(
  iterations: number = 1000,
): Promise<BenchmarkResult> {
  const repo = setupRepository();
  const challengeId = await seedChallenge(repo, "test-challenge-find-123");

  return runBenchmark(
    "ChallengeRepository.findById",
    repo.findById(challengeId),
    iterations,
  );
}

/**
 * Benchmark ChallengeRepository.findByTripId
 */
async function benchmarkRepoFindByTripId(
  iterations: number = 1000,
): Promise<BenchmarkResult> {
  const repo = setupRepository();
  await seedChallenge(repo);

  return runBenchmark(
    "ChallengeRepository.findByTripId",
    repo.findByTripId("trip-123"),
    iterations,
  );
}

/**
 * Benchmark ChallengeRepository.findActive
 */
async function benchmarkRepoFindActive(
  iterations: number = 1000,
): Promise<BenchmarkResult> {
  const repo = setupRepository();
  await seedChallenge(repo);

  return runBenchmark(
    "ChallengeRepository.findActive",
    Effect.gen(function* () {
      // Create an active challenge
      const activeChallenge = yield* Challenge.create({
        tripId: "trip-active",
        name: "Active Challenge",
        description: "An active challenge",
        submissionType: SubmissionType.PHOTO,
        scoringCategory: ScoringCategory.PHOTO,
        status: ChallengeStatus.ACTIVE,
      });
      const saved = yield* repo.create(activeChallenge);
      return yield* repo.findById(saved.id);
    }),
    iterations,
  );
}

/**
 * Benchmark ChallengeRepository.create
 */
async function benchmarkRepoCreate(
  iterations: number = 1000,
): Promise<BenchmarkResult> {
  return runBenchmark(
    "ChallengeRepository.create",
    Effect.gen(function* () {
      const repo = new InMemoryChallengeRepository();
      const challenge = yield* Challenge.create({
        tripId: `trip-${Date.now()}`,
        name: `Challenge-${Date.now()}`,
        description: "Test",
        image: null,
        submissionType: SubmissionType.PHOTO,
        scoringCategory: ScoringCategory.PHOTO,
        isRecurring: false,
        dailyStartTime: null,
        dailyEndTime: null,
        basePoints: 10,
        firstPlacePoints: null,
        secondPlacePoints: null,
        thirdPlacePoints: null,
        status: ChallengeStatus.DRAFT,
        startTime: null,
        endTime: null,
        votingStartTime: null,
        votingEndTime: null,
        targetLatitude: null,
        targetLongitude: null,
        expectedValue: null,
        autoApprove: false,
      });
      return yield* repo.create(challenge);
    }),
    iterations,
  );
}

/**
 * Run all challenge operation benchmarks
 */
export async function runChallengeBenchmarks(
  iterations: number = 1000,
  baselines?: Map<string, BenchmarkResult>,
): Promise<BenchmarkComparison[]> {
  console.log("\n📊 Running Challenge Operation Benchmarks...\n");

  const comparisons: BenchmarkComparison[] = [];

  // GetChallenge benchmark
  console.log("  Benchmarking GetChallenge...");
  const getChallengeResult = await benchmarkGetChallenge(iterations);
  comparisons.push(
    compareBenchmarks(
      "GetChallenge Use Case",
      getChallengeResult,
      baselines?.get("GetChallenge"),
    ),
  );
  console.log(
    `    ✓ ${getChallengeResult.avgTimeMs.toFixed(3)}ms avg (${getChallengeResult.opsPerSecond.toFixed(0)} ops/sec)`,
  );

  // CreateChallenge benchmark
  console.log("  Benchmarking CreateChallenge...");
  const createChallengeResult = await benchmarkCreateChallenge(iterations);
  comparisons.push(
    compareBenchmarks(
      "CreateChallenge Use Case",
      createChallengeResult,
      baselines?.get("CreateChallenge"),
    ),
  );
  console.log(
    `    ✓ ${createChallengeResult.avgTimeMs.toFixed(3)}ms avg (${createChallengeResult.opsPerSecond.toFixed(0)} ops/sec)`,
  );

  // Repository benchmarks
  console.log("  Benchmarking ChallengeRepository.findById...");
  const findByIdResult = await benchmarkRepoFindById(iterations);
  comparisons.push(
    compareBenchmarks(
      "ChallengeRepository.findById",
      findByIdResult,
      baselines?.get("ChallengeRepository.findById"),
    ),
  );
  console.log(
    `    ✓ ${findByIdResult.avgTimeMs.toFixed(3)}ms avg (${findByIdResult.opsPerSecond.toFixed(0)} ops/sec)`,
  );

  console.log("  Benchmarking ChallengeRepository.findByTripId...");
  const findByTripIdResult = await benchmarkRepoFindByTripId(iterations);
  comparisons.push(
    compareBenchmarks(
      "ChallengeRepository.findByTripId",
      findByTripIdResult,
      baselines?.get("ChallengeRepository.findByTripId"),
    ),
  );
  console.log(
    `    ✓ ${findByTripIdResult.avgTimeMs.toFixed(3)}ms avg (${findByTripIdResult.opsPerSecond.toFixed(0)} ops/sec)`,
  );

  console.log("  Benchmarking ChallengeRepository.findActive...");
  const findActiveResult = await benchmarkRepoFindActive(iterations);
  comparisons.push(
    compareBenchmarks(
      "ChallengeRepository.findActive",
      findActiveResult,
      baselines?.get("ChallengeRepository.findActive"),
    ),
  );
  console.log(
    `    ✓ ${findActiveResult.avgTimeMs.toFixed(3)}ms avg (${findActiveResult.opsPerSecond.toFixed(0)} ops/sec)`,
  );

  console.log("  Benchmarking ChallengeRepository.create...");
  const repoCreateResult = await benchmarkRepoCreate(iterations);
  comparisons.push(
    compareBenchmarks(
      "ChallengeRepository.create",
      repoCreateResult,
      baselines?.get("ChallengeRepository.create"),
    ),
  );
  console.log(
    `    ✓ ${repoCreateResult.avgTimeMs.toFixed(3)}ms avg (${repoCreateResult.opsPerSecond.toFixed(0)} ops/sec)`,
  );

  return comparisons;
}

// Run if called directly
if (import.meta.main) {
  runChallengeBenchmarks(1000).then((comparisons) => {
    const { printSummary } = require("./utils");
    printSummary(comparisons);
    process.exit(comparisons.every((c) => c.withinThreshold) ? 0 : 1);
  });
}
