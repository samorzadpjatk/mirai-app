#!/usr/bin/env bun

import { execSync } from "node:child_process";
import fs from "node:fs";
import { classifyCommit, highestBump } from "./version-bump-policy.js";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function safeExec(command) {
  return execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function latestTagOrNull() {
  try {
    return safeExec("git describe --tags --abbrev=0");
  } catch {
    return null;
  }
}

function readCommits(fromRef, toRef) {
  const range = fromRef ? `${fromRef}..${toRef}` : toRef;
  const output = safeExec(`git log --format=%B%n==END== ${range}`);
  return output
    .split("==END==")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function writeGithubOutput(result) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;
  const lines = [
    `bump=${result.bump}`,
    `commits_analyzed=${result.commitsAnalyzed}`,
    `from_ref=${result.fromRef ?? ""}`,
    `to_ref=${result.toRef}`,
  ];
  fs.appendFileSync(outputPath, `${lines.join("\n")}\n`);
}

function main() {
  const args = parseArgs(process.argv);
  const toRef = args.to ?? "HEAD";
  const fromRef = args.from || latestTagOrNull();

  const commits = readCommits(fromRef, toRef);
  const bump = highestBump(commits.map(classifyCommit));

  const result = {
    bump,
    fromRef,
    toRef,
    commitsAnalyzed: commits.length,
  };

  writeGithubOutput(result);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main();
