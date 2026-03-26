#!/usr/bin/env bun

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const REQUIRED_ENV = [
  "ANDROID_APP_PACKAGE",
  "PLAY_JSON_KEY_PATH",
  "ANDROID_KEYSTORE_PATH",
  "ANDROID_KEYSTORE_PASSWORD",
  "ANDROID_KEY_ALIAS",
  "ANDROID_KEY_PASSWORD",
  "ANDROID_SIGNING_LINEAGE",
];

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runCapture(command, args) {
  const result = spawnSync(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    env: process.env,
  });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || "Command failed\n");
    process.exit(result.status ?? 1);
  }
  return result.stdout.trim();
}

function importCredentialsFromEnv() {
  // If all required environment variables are already set, skip import
  const allEnvSet = REQUIRED_ENV.every((key) => {
    const value = process.env[key];
    return value && value.trim();
  });

  if (allEnvSet) {
    process.stdout.write(
      "[local-cd] All required environment variables already set, skipping credential import.\n",
    );
    return;
  }

  // Find and execute the credential import script
  const scriptDir = path.dirname(import.meta.url.replace("file://", ""));
  const credentialScript = path.join(
    scriptDir,
    "import_credentials_into_env.sh",
  );

  if (!fs.existsSync(credentialScript)) {
    throw new Error(`Credential import script not found: ${credentialScript}`);
  }

  process.stdout.write("[local-cd] Importing credentials from env...\n");

  // Execute the credential import script using bash and capture the environment
  const result = spawnSync("bash", [credentialScript], {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(
      `Failed to import credentials: ${result.stderr || "Unknown error"}`,
    );
  }

  process.stdout.write(result.stdout);
}

function ensurePrerequisites() {
  for (const key of REQUIRED_ENV) {
    const value = process.env[key];
    if (!value || !value.trim()) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  if (!fs.existsSync(process.env.PLAY_JSON_KEY_PATH)) {
    throw new Error(
      `PLAY_JSON_KEY_PATH does not exist: ${process.env.PLAY_JSON_KEY_PATH}`,
    );
  }
  if (!fs.existsSync(process.env.ANDROID_KEYSTORE_PATH)) {
    throw new Error(
      `ANDROID_KEYSTORE_PATH does not exist: ${process.env.ANDROID_KEYSTORE_PATH}`,
    );
  }
}

function ensureVersionName(fromRef, toRef) {
  if (
    process.env.RELEASE_VERSION_NAME &&
    process.env.RELEASE_VERSION_NAME.trim()
  ) {
    process.env.RELEASE_VERSION_NAME = process.env.RELEASE_VERSION_NAME.replace(
      /^v/,
      "",
    );
    return;
  }

  const deriveArgs = ["./scripts/release/derive-bump-intent.js", "--to", toRef];
  if (fromRef) {
    deriveArgs.push("--from", fromRef);
  }
  const bumpRaw = runCapture("bun", deriveArgs);
  const bumpJson = JSON.parse(bumpRaw);

  const semverRaw = runCapture("bun", [
    "./scripts/release/resolve-semver-local.js",
    "--bump",
    bumpJson.bump,
  ]);
  const semverJson = JSON.parse(semverRaw);
  process.env.RELEASE_VERSION_NAME = semverJson.versionName;
  process.stdout.write(
    `[local-cd] Resolved RELEASE_VERSION_NAME=${process.env.RELEASE_VERSION_NAME} from bump=${bumpJson.bump}\n`,
  );
}

function maybeConfirm(label, forceYes) {
  if (forceYes) return true;
  process.stdout.write(`${label} Type 'yes' to continue: `);
  const answer = fs.readFileSync(0, "utf8").trim().toLowerCase();
  return answer === "yes";
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help || args.h) {
    process.stdout.write(
      [
        "Usage: bun ./scripts/release/run-local-cd.js [options]",
        "",
        "Options:",
        "  --from-ref <ref>          Commit range start for bump intent",
        "  --to-ref <ref>            Commit range end for bump intent (default: HEAD)",
        "  --promote-beta            Promote internal -> beta after upload",
        "  --promote-production      Promote beta -> production (requires --promote-beta)",
        "  --yes                     Auto-approve promotion prompts",
        "  --skip-credential-import  Skip automatic credential import from JSON files",
        "  --help                    Show this help",
        "",
        "Credentials will be automatically imported from apps/native/app.json and",
        "apps/native/credentials.json unless --skip-credential-import is specified.",
      ].join("\n"),
    );
    return;
  }

  const promoteBeta = Boolean(args["promote-beta"]);
  const promoteProduction = Boolean(args["promote-production"]);
  const yes = Boolean(args.yes);
  const skipCredentialImport = Boolean(args["skip-credential-import"]);
  const fromRef = (args["from-ref"] || process.env.RELEASE_FROM_REF || "")
    .toString()
    .trim();
  const toRef = (
    args["to-ref"] ||
    process.env.RELEASE_TO_REF ||
    "HEAD"
  ).toString();

  try {
    // Import credentials first (unless explicitly skipped)
    if (!skipCredentialImport) {
      importCredentialsFromEnv();
    }

    // Then verify all prerequisites are met
    ensurePrerequisites();
    ensureVersionName(fromRef || undefined, toRef);

    run("bundle", ["exec", "fastlane", "android", "android_release"]);

    const metadataPath = "dist/android/release-metadata.json";
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    const versionCode = String(metadata.versionCode);
    process.stdout.write(
      `[local-cd] Internal upload complete for versionCode=${versionCode}\n`,
    );

    if (promoteBeta) {
      if (!maybeConfirm("Approve promotion internal -> beta.", yes)) {
        process.stdout.write(
          "[local-cd] Promotion to beta skipped by operator.\n",
        );
        return;
      }
      run("bundle", [
        "exec",
        "fastlane",
        "android",
        "android_promote",
        `from_track:internal`,
        `to_track:beta`,
        `version_code:${versionCode}`,
        `metadata_path:${metadataPath}`,
      ]);
    }

    if (promoteProduction) {
      if (!promoteBeta) {
        throw new Error("--promote-production requires --promote-beta");
      }
      if (!maybeConfirm("Approve promotion beta -> production.", yes)) {
        process.stdout.write(
          "[local-cd] Promotion to production skipped by operator.\n",
        );
        return;
      }
      run("bundle", [
        "exec",
        "fastlane",
        "android",
        "android_promote",
        `from_track:beta`,
        `to_track:production`,
        `version_code:${versionCode}`,
        `metadata_path:${metadataPath}`,
      ]);
    }
  } catch (error) {
    process.stderr.write(`[local-cd] Error: ${error.message}\n`);
    process.exit(1);
  }
}

main();
