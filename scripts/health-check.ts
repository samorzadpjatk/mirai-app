#!/usr/bin/env bun
/**
 * Monorepo health check script.
 * Usage: bun run health
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import pc from "picocolors";

const log = {
  ok: (msg: string) => console.log(`${pc.green("✓")} ${msg}`),
  warn: (msg: string) => console.log(`${pc.yellow("⚠")} ${msg}`),
  err: (msg: string) => console.log(`${pc.red("✗")} ${msg}`),
};

let issues = 0;

function check(name: string, fn: () => boolean) {
  try {
    if (fn()) {
      log.ok(name);
    } else {
      log.warn(name);
      issues++;
    }
  } catch (e) {
    log.err(`${name}: ${e}`);
    issues++;
  }
}

console.log(`${pc.bold("MIRAI Monorepo Health Check")}\n`);

check("Root node_modules installed", () => existsSync(resolve("node_modules")));

const workspaces = [
  ...readdirSync("apps").map((d) => `apps/${d}`),
  ...readdirSync("packages").map((d) => `packages/${d}`),
].filter((ws) => existsSync(resolve(ws, "package.json")));
for (const ws of workspaces) {
  check(`${ws} node_modules`, () => existsSync(resolve(ws, "node_modules")));
}

check("Lockfile (bun.lock) exists", () => existsSync(resolve("bun.lock")));

check("environment/.env exists", () => existsSync(resolve("environment/.env")));
check("environment/.env.dev exists", () => existsSync(resolve("environment/.env.dev")));

for (const ws of workspaces) {
  const pkgPath = resolve(ws, "package.json");
  if (!existsSync(pkgPath)) continue;
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const hasLint = !!pkg.scripts?.lint;
  const hasTypecheck = !!pkg.scripts?.typecheck;
  const hasFormatCheck = !!pkg.scripts?.["format:check"];
  if (!hasLint || !hasTypecheck || !hasFormatCheck) {
    log.warn(`${ws} missing lint/typecheck/format:check scripts`);
    issues++;
  } else {
    log.ok(`${ws} has standard scripts`);
  }
}

check("nx.json exists", () => existsSync(resolve("nx.json")));

check("Docker available", () => {
  try {
    Bun.spawnSync({ cmd: ["docker", "--version"], stdout: "ignore" });
    return true;
  } catch {
    return false;
  }
});

check("Husky pre-commit hook exists", () => existsSync(resolve(".husky/pre-commit")));
check("Husky commit-msg hook exists", () => existsSync(resolve(".husky/commit-msg")));

console.log(
  `\n${issues === 0 ? pc.green("All checks passed!") : pc.yellow(`${issues} issue(s) found`)}\n`,
);
process.exit(issues > 0 ? 1 : 0);
