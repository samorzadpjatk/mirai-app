#!/usr/bin/env node

import { execSync } from "node:child_process";
import {
  bumpSemver,
  classifyCommit,
  highestBump,
} from "./version-bump-policy.js";

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

function readCommits(fromRef, toRef) {
  const range = fromRef ? `${fromRef}..${toRef}` : toRef;
  const out = execSync(`git log --format=%B%n==END== ${range}`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return out
    .split("==END==")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function main() {
  const args = parseArgs(process.argv);
  const currentVersion = args["current-version"];
  const fromRef = args.from;
  const toRef = args.to ?? "HEAD";

  if (!currentVersion) {
    throw new Error("Missing --current-version");
  }

  const commits = readCommits(fromRef, toRef);
  const bumps = commits.map(classifyCommit);
  const bump = highestBump(bumps);
  const nextVersion = bumpSemver(currentVersion, bump);

  process.stdout.write(
    JSON.stringify(
      {
        bump,
        currentVersion,
        nextVersion,
        commitsAnalyzed: commits.length,
      },
      null,
      2,
    ),
  );
}

main();
