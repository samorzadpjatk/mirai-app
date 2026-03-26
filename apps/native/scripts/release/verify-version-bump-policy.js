#!/usr/bin/env node

import {
  bumpSemver,
  classifyCommit,
  highestBump,
} from "./version-bump-policy.js";

const cases = [
  {
    name: "feature commit bumps minor",
    current: "1.2.3",
    commits: ["feat(native): add Android release lane"],
    expectedBump: "minor",
    expectedNext: "1.3.0",
  },
  {
    name: "fix commit bumps patch",
    current: "1.2.3",
    commits: ["fix(ci): correct release artifact path"],
    expectedBump: "patch",
    expectedNext: "1.2.4",
  },
  {
    name: "breaking marker bumps major",
    current: "1.2.3",
    commits: [
      "refactor!: replace release lane",
      "BREAKING CHANGE: lane name changed",
    ],
    expectedBump: "major",
    expectedNext: "2.0.0",
  },
  {
    name: "non-release types do not bump",
    current: "1.2.3",
    commits: [
      "docs(native): update release docs",
      "chore(ci): refactor workflow names",
    ],
    expectedBump: "none",
    expectedNext: "1.2.3",
  },
  {
    name: "highest bump wins",
    current: "1.2.3",
    commits: ["fix(native): tune signing", "feat(native): add promotion lane"],
    expectedBump: "minor",
    expectedNext: "1.3.0",
  },
];

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

for (const testCase of cases) {
  const bumps = testCase.commits.map(classifyCommit);
  const bump = highestBump(bumps);
  const next = bumpSemver(testCase.current, bump);

  if (bump !== testCase.expectedBump) {
    fail(
      `${testCase.name}: expected bump=${testCase.expectedBump} got=${bump}`,
    );
  }
  if (next !== testCase.expectedNext) {
    fail(
      `${testCase.name}: expected next=${testCase.expectedNext} got=${next}`,
    );
  }
}

process.stdout.write(
  `Verified ${cases.length} Conventional Commit versioning cases\n`,
);
