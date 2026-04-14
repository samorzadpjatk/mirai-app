/**
 * Main Benchmark Runner
 *
 * Orchestrates all performance benchmarks for the Effect Framework Migration.
 * Runs benchmarks for user operations, challenge operations, and repository queries.
 *
 * @module .specs/benchmarks/runner
 */

import { runUserBenchmarks } from "./user-operations";
import { runChallengeBenchmarks } from "./challenge-operations";
import {
  generateMarkdownReport,
  printSummary,
  type BenchmarkComparison,
  type BenchmarkResult,
} from "./utils";

/**
 * Benchmark runner options
 */
export interface BenchmarkOptions {
  /** Number of iterations per benchmark (default: 1000) */
  iterations?: number;
  /** Whether to save results to file (default: true) */
  saveResults?: boolean;
  /** Output directory for results (default: ./results) */
  outputDir?: string;
  /** Baseline results for comparison */
  baselines?: Map<string, BenchmarkResult>;
}

/**
 * Run all benchmarks
 */
export async function runAllBenchmarks(
  options: BenchmarkOptions = {},
): Promise<{
  comparisons: BenchmarkComparison[];
  allWithinThreshold: boolean;
  report: string;
}> {
  const { iterations = 1000, baselines } = options;

  console.log("\n" + "=".repeat(80));
  console.log("EFFECT FRAMEWORK MIGRATION - PERFORMANCE BENCHMARKS");
  console.log("=".repeat(80));
  console.log(`Iterations per test: ${iterations.toLocaleString()}`);
  console.log(`Threshold: ±10% of baseline (if available)`);
  console.log("=".repeat(80) + "\n");

  const allComparisons: BenchmarkComparison[] = [];

  // Run user benchmarks
  const userComparisons = await runUserBenchmarks(iterations, baselines);
  allComparisons.push(...userComparisons);

  // Run challenge benchmarks
  const challengeComparisons = await runChallengeBenchmarks(
    iterations,
    baselines,
  );
  allComparisons.push(...challengeComparisons);

  // Print summary
  printSummary(allComparisons);

  // Generate report
  const timestamp = new Date().toISOString();
  const report = generateMarkdownReport(
    "Effect Framework Performance Benchmark Results",
    allComparisons,
    timestamp,
  );

  const allWithinThreshold = allComparisons.every((c) => c.withinThreshold);

  return {
    comparisons: allComparisons,
    allWithinThreshold,
    report,
  };
}

/**
 * Load baseline results from JSON
 */
export function loadBaselines(jsonData: string): Map<string, BenchmarkResult> {
  const data = JSON.parse(jsonData);
  const baselines = new Map<string, BenchmarkResult>();

  for (const [key, value] of Object.entries(data)) {
    baselines.set(key, value as BenchmarkResult);
  }

  return baselines;
}

/**
 * Save comparison results to JSON
 */
export function resultsToJson(
  comparisons: BenchmarkComparison[],
): Record<string, BenchmarkResult> {
  const results: Record<string, BenchmarkResult> = {};

  for (const comparison of comparisons) {
    results[comparison.name] = comparison.effectResult;
  }

  return results;
}

// Run if called directly
if (import.meta.main) {
  const iterations = parseInt(process.argv[2] || "1000", 10);

  runAllBenchmarks({ iterations }).then(
    ({ comparisons, allWithinThreshold, report }) => {
      // Print report
      console.log("\n" + report);

      // Output JSON results for programmatic use
      const jsonResults = resultsToJson(comparisons);
      console.log("\n\n--- JSON RESULTS ---");
      console.log(JSON.stringify(jsonResults, null, 2));

      // Exit with appropriate code
      process.exit(allWithinThreshold ? 0 : 1);
    },
  );
}
