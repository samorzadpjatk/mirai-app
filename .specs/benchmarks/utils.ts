/**
 * Benchmark Utilities
 *
 * Shared utilities for performance benchmarking Effect-based operations.
 *
 * @module .specs/benchmarks/utils
 */

import { Effect } from "effect";

/**
 * Benchmark result for a single operation
 */
export interface BenchmarkResult {
  /** Operation name */
  name: string;
  /** Number of iterations */
  iterations: number;
  /** Total execution time in milliseconds */
  totalTimeMs: number;
  /** Average time per operation in milliseconds */
  avgTimeMs: number;
  /** Operations per second */
  opsPerSecond: number;
  /** Minimum time per operation in milliseconds */
  minTimeMs: number;
  /** Maximum time per operation in milliseconds */
  maxTimeMs: number;
  /** Standard deviation in milliseconds */
  stdDevMs: number;
}

/**
 * Benchmark comparison result
 */
export interface BenchmarkComparison {
  /** Test name */
  name: string;
  /** Effect-based result */
  effectResult: BenchmarkResult;
  /** Baseline result (if available) */
  baselineResult?: BenchmarkResult;
  /** Percentage difference from baseline (negative = faster, positive = slower) */
  percentDifference?: number;
  /** Whether the result is within acceptable threshold (±10%) */
  withinThreshold: boolean;
}

/**
 * Run a benchmark for an Effect-based operation
 *
 * @param name - Benchmark name
 * @param operation - Effect operation to benchmark
 * @param iterations - Number of iterations (default: 1000)
 * @returns Benchmark result
 */
export async function runBenchmark<T>(
  name: string,
  operation: Effect.Effect<T, unknown, unknown>,
  iterations: number = 1000,
): Promise<BenchmarkResult> {
  const times: number[] = [];

  // Warmup: run 10% of iterations to warm up JIT
  const warmupIterations = Math.max(10, Math.floor(iterations * 0.1));
  for (let i = 0; i < warmupIterations; i++) {
    await Effect.runPromise(operation);
  }

  // Actual benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await Effect.runPromise(operation);
    const end = performance.now();
    times.push(end - start);
  }

  const totalTimeMs = times.reduce((sum, t) => sum + t, 0);
  const avgTimeMs = totalTimeMs / iterations;
  const opsPerSecond = 1000 / avgTimeMs;
  const minTimeMs = Math.min(...times);
  const maxTimeMs = Math.max(...times);

  // Calculate standard deviation
  const variance =
    times.reduce((sum, t) => sum + Math.pow(t - avgTimeMs, 2), 0) / iterations;
  const stdDevMs = Math.sqrt(variance);

  return {
    name,
    iterations,
    totalTimeMs,
    avgTimeMs,
    opsPerSecond,
    minTimeMs,
    maxTimeMs,
    stdDevMs,
  };
}

/**
 * Run a benchmark for a Promise-based operation (for baseline comparison)
 *
 * @param name - Benchmark name
 * @param operation - Promise operation to benchmark
 * @param iterations - Number of iterations (default: 1000)
 * @returns Benchmark result
 */
export async function runPromiseBenchmark<T>(
  name: string,
  operation: () => Promise<T>,
  iterations: number = 1000,
): Promise<BenchmarkResult> {
  const times: number[] = [];

  // Warmup
  const warmupIterations = Math.max(10, Math.floor(iterations * 0.1));
  for (let i = 0; i < warmupIterations; i++) {
    await operation();
  }

  // Actual benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await operation();
    const end = performance.now();
    times.push(end - start);
  }

  const totalTimeMs = times.reduce((sum, t) => sum + t, 0);
  const avgTimeMs = totalTimeMs / iterations;
  const opsPerSecond = 1000 / avgTimeMs;
  const minTimeMs = Math.min(...times);
  const maxTimeMs = Math.max(...times);

  const variance =
    times.reduce((sum, t) => sum + Math.pow(t - avgTimeMs, 2), 0) / iterations;
  const stdDevMs = Math.sqrt(variance);

  return {
    name,
    iterations,
    totalTimeMs,
    avgTimeMs,
    opsPerSecond,
    minTimeMs,
    maxTimeMs,
    stdDevMs,
  };
}

/**
 * Compare Effect-based result with baseline
 *
 * @param name - Test name
 * @param effectResult - Effect benchmark result
 * @param baselineResult - Optional baseline result
 * @returns Comparison result
 */
export function compareBenchmarks(
  name: string,
  effectResult: BenchmarkResult,
  baselineResult?: BenchmarkResult,
): BenchmarkComparison {
  let percentDifference: number | undefined;
  let withinThreshold = true;

  if (baselineResult) {
    percentDifference =
      ((effectResult.avgTimeMs - baselineResult.avgTimeMs) /
        baselineResult.avgTimeMs) *
      100;
    withinThreshold = Math.abs(percentDifference) <= 10;
  }

  return {
    name,
    effectResult,
    baselineResult,
    percentDifference,
    withinThreshold,
  };
}

/**
 * Format benchmark result as markdown table row
 */
export function formatResultAsMarkdownRow(result: BenchmarkResult): string {
  return `| ${result.name} | ${result.iterations.toLocaleString()} | ${result.avgTimeMs.toFixed(3)} | ${result.minTimeMs.toFixed(3)} | ${result.maxTimeMs.toFixed(3)} | ${result.stdDevMs.toFixed(3)} | ${result.opsPerSecond.toFixed(0)} |`;
}

/**
 * Format benchmark comparison as markdown
 */
export function formatComparisonAsMarkdown(
  comparison: BenchmarkComparison,
): string {
  const {
    name,
    effectResult,
    baselineResult,
    percentDifference,
    withinThreshold,
  } = comparison;

  let status: string;
  if (!baselineResult) {
    status = "🟡 No baseline";
  } else if (withinThreshold) {
    status =
      percentDifference && percentDifference < 0
        ? "🟢 Faster"
        : percentDifference && percentDifference > 0
          ? "🟢 Within threshold"
          : "🟢 Equal";
  } else {
    status =
      percentDifference && percentDifference > 0
        ? "🔴 Slower (>10%)"
        : "🟢 Faster (>10%)";
  }

  const diffStr =
    percentDifference !== undefined
      ? `${percentDifference > 0 ? "+" : ""}${percentDifference.toFixed(1)}%`
      : "N/A";

  return `| ${name} | ${effectResult.avgTimeMs.toFixed(3)}ms | ${baselineResult ? baselineResult.avgTimeMs.toFixed(3) + "ms" : "N/A"} | ${diffStr} | ${status} |`;
}

/**
 * Print benchmark summary to console
 */
export function printSummary(comparisons: BenchmarkComparison[]): boolean {
  console.log("\n" + "=".repeat(80));
  console.log("PERFORMANCE BENCHMARK SUMMARY");
  console.log("=".repeat(80));

  const withBaseline = comparisons.filter((c) => c.baselineResult);
  const withoutBaseline = comparisons.filter((c) => !c.baselineResult);
  const withinThreshold = comparisons.filter((c) => c.withinThreshold);
  const outsideThreshold = comparisons.filter(
    (c) => !c.withinThreshold && c.baselineResult,
  );

  console.log(`\nTotal benchmarks: ${comparisons.length}`);
  console.log(`  - With baseline: ${withBaseline.length}`);
  console.log(`  - Without baseline: ${withoutBaseline.length}`);
  console.log(`  - Within ±10% threshold: ${withinThreshold.length}`);
  console.log(`  - Outside ±10% threshold: ${outsideThreshold.length}`);

  if (outsideThreshold.length > 0) {
    console.log("\n⚠️  Regressions detected:");
    outsideThreshold.forEach((c) => {
      console.log(
        `  - ${c.name}: ${c.percentDifference?.toFixed(1)}% ${c.percentDifference && c.percentDifference > 0 ? "slower" : "faster"}`,
      );
    });
  }

  const allWithinThreshold = comparisons.every((c) => c.withinThreshold);
  console.log("\n" + "=".repeat(80));
  console.log(
    allWithinThreshold
      ? "✅ All benchmarks within threshold"
      : "❌ Some benchmarks outside threshold",
  );
  console.log("=".repeat(80) + "\n");

  return allWithinThreshold;
}

/**
 * Generate full markdown report
 */
export function generateMarkdownReport(
  title: string,
  comparisons: BenchmarkComparison[],
  timestamp: string = new Date().toISOString(),
): string {
  const withBaseline = comparisons.filter((c) => c.baselineResult);
  const allWithinThreshold = comparisons.every((c) => c.withinThreshold);

  let markdown = `# ${title}\n\n`;
  markdown += `**Generated:** ${timestamp}\n\n`;

  // Summary
  markdown += "## Summary\n\n";
  markdown += `- **Total Benchmarks:** ${comparisons.length}\n`;
  markdown += `- **With Baseline:** ${withBaseline.length}\n`;
  markdown += `- **Within ±10% Threshold:** ${comparisons.filter((c) => c.withinThreshold).length}\n`;
  markdown += `- **Overall Status:** ${allWithinThreshold ? "✅ PASSED" : "❌ FAILED"}\n\n`;

  // Detailed Results
  markdown += "## Detailed Results\n\n";
  markdown += "| Test | Effect Avg | Baseline Avg | Difference | Status |\n";
  markdown += "|------|------------|--------------|------------|--------|\n";

  for (const comparison of comparisons) {
    markdown += formatComparisonAsMarkdown(comparison) + "\n";
  }

  // Effect-only Results
  markdown += "\n## Effect-Based Performance\n\n";
  markdown +=
    "| Test | Iterations | Avg (ms) | Min (ms) | Max (ms) | StdDev (ms) | Ops/sec |\n";
  markdown +=
    "|------|------------|----------|----------|----------|-------------|---------|\n";

  for (const comparison of comparisons) {
    markdown += formatResultAsMarkdownRow(comparison.effectResult) + "\n";
  }

  // Regressions
  const regressions = comparisons.filter(
    (c) =>
      !c.withinThreshold &&
      c.baselineResult &&
      c.percentDifference &&
      c.percentDifference > 10,
  );

  if (regressions.length > 0) {
    markdown += "\n## ⚠️ Regressions (>10% slower)\n\n";
    for (const reg of regressions) {
      markdown += `- **${reg.name}**: +${reg.percentDifference?.toFixed(1)}% slower than baseline\n`;
    }
  }

  return markdown;
}
