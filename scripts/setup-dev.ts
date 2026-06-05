#!/usr/bin/env bun
/**
 * One-command development environment setup.
 * Usage: bun run setup:dev
 */

import { spawn } from "child_process";
import { existsSync } from "fs";
import { resolve } from "path";
import pc from "picocolors";

const ENV_DIR = resolve(__dirname, "../environment");
const ENV_FILE = resolve(ENV_DIR, ".env");
const COMPOSE_FILE = resolve(ENV_DIR, "docker-compose.dev.yml");
const SEED_DIR = resolve(__dirname, "../apps/seed");

const log = {
  info: (msg: string) => console.log(`${pc.blue("ℹ")} ${msg}`),
  success: (msg: string) => console.log(`${pc.green("✓")} ${msg}`),
  warn: (msg: string) => console.log(`${pc.yellow("⚠")} ${msg}`),
  error: (msg: string) => console.log(`${pc.red("✗")} ${msg}`),
  step: (n: number, total: number, msg: string) =>
    console.log(`\n${pc.bold(`Step ${n}/${total}: ${msg}`)}`),
};

function run(
  cmd: string,
  args: string[],
  opts?: { cwd?: string; env?: NodeJS.ProcessEnv },
): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      cwd: opts?.cwd,
      env: { ...process.env, ...opts?.env },
    });
    child.on("close", (code) => {
      if (code === 0) resolve(0);
      else reject(new Error(`Command failed with exit code ${code}`));
    });
  });
}

function runSilent(
  cmd: string,
  args: string[],
  opts?: { cwd?: string },
): Promise<{ stdout: string; code: number }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      stdio: ["ignore", "pipe", "pipe"],
      cwd: opts?.cwd,
    });
    let stdout = "";
    child.stdout?.on("data", (d) => {
      stdout += d.toString();
    });
    child.on("close", (code) => resolve({ stdout, code: code ?? 1 }));
  });
}

async function checkPrereq(name: string, cmd: string, args: string[]): Promise<boolean> {
  const { code } = await runSilent(cmd, args);
  if (code !== 0) {
    log.error(`${name} is not installed or not in PATH`);
    return false;
  }
  log.success(`${name} found`);
  return true;
}

async function waitForPostgres(): Promise<boolean> {
  const maxRetries = 30;
  const delay = 2000;

  log.info("Waiting for PostgreSQL to be ready...");

  for (let i = 0; i < maxRetries; i++) {
    const { code } = await runSilent("docker", [
      "compose",
      "-f",
      COMPOSE_FILE,
      "exec",
      "-T",
      "db",
      "pg_isready",
      "-U",
      "postgres",
    ]);
    if (code === 0) {
      log.success("PostgreSQL is ready");
      return true;
    }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, delay));
  }

  log.error("PostgreSQL failed to become ready after 60 seconds");
  return false;
}

async function main() {
  console.log(`${pc.bold("MIRAI Dev Environment Setup")}\n`);

  log.step(1, 5, "Check prerequisites");
  const hasDocker = await checkPrereq("Docker", "docker", ["--version"]);
  const hasCompose = await checkPrereq("Docker Compose", "docker", ["compose", "version"]);
  const hasBun = await checkPrereq("Bun", "bun", ["--version"]);

  if (!hasDocker || !hasCompose || !hasBun) {
    log.error("Please install missing prerequisites and try again.");
    process.exit(1);
  }

  if (!existsSync(ENV_FILE)) {
    log.warn(`Missing ${ENV_FILE}`);
    log.info("Copy environment/.env.example to environment/.env and fill in values");
    process.exit(1);
  }
  log.success("Environment file found");

  log.step(2, 5, "Start Docker environment");
  try {
    await run("docker", ["compose", "-f", COMPOSE_FILE, "up", "-d"], { cwd: ENV_DIR });
    log.success("Docker services started");
  } catch {
    log.error("Failed to start Docker services");
    process.exit(1);
  }

  log.step(3, 5, "Wait for database");
  const pgReady = await waitForPostgres();
  if (!pgReady) {
    log.error("Database not ready. Check docker compose logs:");
    console.log(`  docker compose -f ${COMPOSE_FILE} logs db`);
    process.exit(1);
  }

  log.step(4, 5, "Push Drizzle schema");
  try {
    await run("bun", ["run", "db:push:dev"], { cwd: SEED_DIR });
    log.success("Drizzle schema pushed");
  } catch {
    log.error("Failed to push Drizzle schema");
    process.exit(1);
  }

  log.step(5, 5, "Seed database");
  try {
    await run("bun", ["run", "dev"], { cwd: SEED_DIR });
    log.success("Database seeded");
  } catch {
    log.warn("Seeding encountered issues (may be partial)");
  }

  console.log(`\n${pc.bold(pc.green("Setup complete!"))}\n`);
  console.log("Available services:");
  console.log(`  ${pc.blue("Supabase Studio")}  http://localhost:3000`);
  console.log(`  ${pc.blue("Backend API")}      http://localhost:2022`);
  console.log(`  ${pc.blue("Mailpit (email)")}  http://localhost:8025`);
  console.log(`  ${pc.blue("MinIO Console")}    http://localhost:9001`);
  console.log("\nNext steps:");
  console.log("  bun run dev          # Start all apps");
  console.log("  bun run dev:native   # Start Expo dev server only");
  console.log("  bun run dev:backend  # Start backend only");
  console.log(`\nTo stop environment:  docker compose -f ${COMPOSE_FILE} down`);
}

main().catch((err) => {
  log.error(String(err));
  process.exit(1);
});
