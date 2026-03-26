#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readJson(relativePath) {
  const fullPath = path.resolve(relativePath);
  ensure(fs.existsSync(fullPath), `Missing required file: ${relativePath}`);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

function assertEnv(name) {
  const value = process.env[name];
  ensure(
    typeof value === "string" && value.trim().length > 0,
    `Missing environment variable: ${name}`,
  );
  return value.trim();
}

function main() {
  const appJson = readJson("app.json");
  const easJson = readJson("eas.json");

  const appPackage = appJson?.expo?.android?.package;
  ensure(
    typeof appPackage === "string" && appPackage.length > 0,
    "app.json missing expo.android.package",
  );

  const expectedPackage = assertEnv("ANDROID_APP_PACKAGE");
  ensure(
    appPackage === expectedPackage,
    `Package mismatch: app.json=${appPackage} env=${expectedPackage}`,
  );

  const releaseTrack = easJson?.submit?.production?.android?.track;
  ensure(
    releaseTrack === "internal",
    "eas.json submit.production.android.track must remain internal for first upload lineage",
  );

  const productionAutoIncrement = easJson?.build?.production?.autoIncrement;
  ensure(
    productionAutoIncrement === true,
    "eas.json build.production.autoIncrement expected true for prior EAS parity",
  );

  const keystorePath = assertEnv("ANDROID_KEYSTORE_PATH");
  const playJsonPath = assertEnv("PLAY_JSON_KEY_PATH");
  ensure(
    fs.existsSync(path.resolve(keystorePath)),
    `Keystore file not found at ${keystorePath}`,
  );
  ensure(
    fs.existsSync(path.resolve(playJsonPath)),
    `Play JSON key file not found at ${playJsonPath}`,
  );

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        checks: {
          appPackage,
          releaseTrack,
          productionAutoIncrement,
          keystorePath,
          playJsonPath,
        },
      },
      null,
      2,
    ),
  );
}

main();
