/**
 * User Operations Benchmark
 *
 * Performance benchmarks for Effect-based user operations.
 * Tests GetUser and CreateUser use cases.
 *
 * @module .specs/benchmarks/user-operations
 */

import { Effect, Layer } from "effect";
import { User, UserRole } from "@mirai-app/domain";
import { InMemoryUserRepository } from "@mirai-app/adapters/gateways/in-memory";
import { UserRepositoryTag } from "@mirai-app/use-cases/ports/UserRepository";
import {
  GetUserUseCase,
  GetUserInput,
} from "@mirai-app/use-cases/interactors/GetUser";
import {
  createUserUseCase,
  CreateUserInput,
} from "@mirai-app/use-cases/interactors/CreateUser";
import {
  runBenchmark,
  type BenchmarkResult,
  type BenchmarkComparison,
  compareBenchmarks,
} from "./utils";

// Test data
const TEST_USER_DATA = {
  id: "test-user-123",
  authUserId: "auth-test-123",
  firstName: "Test",
  lastName: "User",
  role: UserRole.USER,
};

const CREATE_USER_INPUT: CreateUserInput = {
  authUserId: "auth-new-user",
  firstName: "New",
  lastName: "User",
  role: UserRole.USER,
};

/**
 * Setup in-memory repository with test data
 */
function setupRepository(): InMemoryUserRepository {
  const repo = new InMemoryUserRepository();
  return repo;
}

/**
 * Seed repository with test user
 */
async function seedUser(repo: InMemoryUserRepository): Promise<void> {
  const user = await Effect.runPromise(
    User.create({
      id: TEST_USER_DATA.id,
      authUserId: TEST_USER_DATA.authUserId,
      firstName: TEST_USER_DATA.firstName,
      lastName: TEST_USER_DATA.lastName,
      role: TEST_USER_DATA.role,
    }),
  );
  await Effect.runPromise(repo.create(user));
}

/**
 * Benchmark GetUser use case
 */
async function benchmarkGetUser(
  iterations: number = 1000,
): Promise<BenchmarkResult> {
  const repo = setupRepository();
  await seedUser(repo);

  const useCase = new GetUserUseCase();
  const repoLayer = Layer.succeed(UserRepositoryTag, repo);

  const input: GetUserInput = { userId: TEST_USER_DATA.id };

  return runBenchmark(
    "GetUser",
    useCase.execute(input).pipe(Effect.provide(repoLayer)),
    iterations,
  );
}

/**
 * Benchmark CreateUser use case
 */
async function benchmarkCreateUser(
  iterations: number = 1000,
): Promise<BenchmarkResult> {
  // For CreateUser, we need fresh repository each iteration
  // since we're creating new users
  return runBenchmark(
    "CreateUser",
    Effect.gen(function* () {
      const repo = new InMemoryUserRepository();
      const repoLayer = Layer.succeed(UserRepositoryTag, repo);

      // Generate unique authUserId for each run
      const uniqueInput: CreateUserInput = {
        ...CREATE_USER_INPUT,
        authUserId: `auth-${Date.now()}-${Math.random()}`,
      };

      return yield* createUserUseCase(uniqueInput).pipe(
        Effect.provide(repoLayer),
      );
    }),
    iterations,
  );
}

/**
 * Benchmark UserRepository.findById
 */
async function benchmarkRepoFindById(
  iterations: number = 1000,
): Promise<BenchmarkResult> {
  const repo = setupRepository();
  await seedUser(repo);

  return runBenchmark(
    "UserRepository.findById",
    repo.findById(TEST_USER_DATA.id),
    iterations,
  );
}

/**
 * Benchmark UserRepository.create
 */
async function benchmarkRepoCreate(
  iterations: number = 1000,
): Promise<BenchmarkResult> {
  return runBenchmark(
    "UserRepository.create",
    Effect.gen(function* () {
      const repo = new InMemoryUserRepository();
      const user = yield* User.create({
        id: `user-${Date.now()}-${Math.random()}`,
        authUserId: `auth-${Date.now()}-${Math.random()}`,
        firstName: "Test",
        lastName: "User",
        role: UserRole.USER,
      });
      return yield* repo.create(user);
    }),
    iterations,
  );
}

/**
 * Benchmark UserRepository.existsByAuthUserId
 */
async function benchmarkRepoExists(
  iterations: number = 1000,
): Promise<BenchmarkResult> {
  const repo = setupRepository();
  await seedUser(repo);

  return runBenchmark(
    "UserRepository.existsByAuthUserId",
    repo.existsByAuthUserId(TEST_USER_DATA.authUserId),
    iterations,
  );
}

/**
 * Run all user operation benchmarks
 */
export async function runUserBenchmarks(
  iterations: number = 1000,
  baselines?: Map<string, BenchmarkResult>,
): Promise<BenchmarkComparison[]> {
  console.log("\n📊 Running User Operation Benchmarks...\n");

  const comparisons: BenchmarkComparison[] = [];

  // GetUser benchmark
  console.log("  Benchmarking GetUser...");
  const getUserResult = await benchmarkGetUser(iterations);
  comparisons.push(
    compareBenchmarks(
      "GetUser Use Case",
      getUserResult,
      baselines?.get("GetUser"),
    ),
  );
  console.log(
    `    ✓ ${getUserResult.avgTimeMs.toFixed(3)}ms avg (${getUserResult.opsPerSecond.toFixed(0)} ops/sec)`,
  );

  // CreateUser benchmark
  console.log("  Benchmarking CreateUser...");
  const createUserResult = await benchmarkCreateUser(iterations);
  comparisons.push(
    compareBenchmarks(
      "CreateUser Use Case",
      createUserResult,
      baselines?.get("CreateUser"),
    ),
  );
  console.log(
    `    ✓ ${createUserResult.avgTimeMs.toFixed(3)}ms avg (${createUserResult.opsPerSecond.toFixed(0)} ops/sec)`,
  );

  // Repository benchmarks
  console.log("  Benchmarking UserRepository.findById...");
  const findByIdResult = await benchmarkRepoFindById(iterations);
  comparisons.push(
    compareBenchmarks(
      "UserRepository.findById",
      findByIdResult,
      baselines?.get("UserRepository.findById"),
    ),
  );
  console.log(
    `    ✓ ${findByIdResult.avgTimeMs.toFixed(3)}ms avg (${findByIdResult.opsPerSecond.toFixed(0)} ops/sec)`,
  );

  console.log("  Benchmarking UserRepository.create...");
  const repoCreateResult = await benchmarkRepoCreate(iterations);
  comparisons.push(
    compareBenchmarks(
      "UserRepository.create",
      repoCreateResult,
      baselines?.get("UserRepository.create"),
    ),
  );
  console.log(
    `    ✓ ${repoCreateResult.avgTimeMs.toFixed(3)}ms avg (${repoCreateResult.opsPerSecond.toFixed(0)} ops/sec)`,
  );

  console.log("  Benchmarking UserRepository.existsByAuthUserId...");
  const existsResult = await benchmarkRepoExists(iterations);
  comparisons.push(
    compareBenchmarks(
      "UserRepository.existsByAuthUserId",
      existsResult,
      baselines?.get("UserRepository.existsByAuthUserId"),
    ),
  );
  console.log(
    `    ✓ ${existsResult.avgTimeMs.toFixed(3)}ms avg (${existsResult.opsPerSecond.toFixed(0)} ops/sec)`,
  );

  return comparisons;
}

// Run if called directly
if (import.meta.main) {
  runUserBenchmarks(1000).then((comparisons) => {
    const { printSummary } = require("./utils");
    printSummary(comparisons);
    process.exit(comparisons.every((c) => c.withinThreshold) ? 0 : 1);
  });
}
