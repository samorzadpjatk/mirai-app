#!/usr/bin/env bun

import { execSync } from "node:child_process";

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

function parseSemver(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  if (!match) throw new Error(`Invalid SemVer: ${value}`);
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function bumpVersion(version, bump) {
  const parsed = parseSemver(version);
  if (bump === "major") return `${parsed.major + 1}.0.0`;
  if (bump === "minor") return `${parsed.major}.${parsed.minor + 1}.0`;
  if (bump === "patch")
    return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
  return version;
}

function latestSemverTag() {
  const output = execSync("git tag --sort=-v:refname", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const tags = output
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);

  for (const tag of tags) {
    const normalized = tag.replace(/^v/, "");
    if (/^\d+\.\d+\.\d+$/.test(normalized)) {
      return normalized;
    }
  }
  return "0.0.0";
}

function main() {
  const args = parseArgs(process.argv);
  const bump = (args.bump || "none").toString();
  const baseVersion = (args["base-version"] || latestSemverTag()).toString();
  const versionName = bumpVersion(baseVersion, bump);

  process.stdout.write(
    `${JSON.stringify({ bump, baseVersion, versionName }, null, 2)}\n`,
  );
}

main();
