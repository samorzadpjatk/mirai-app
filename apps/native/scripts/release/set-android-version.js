#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

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

function parseVersionCode(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid versionCode: ${value}`);
  }
  return parsed;
}

function parseSemver(value) {
  if (!/^\d+\.\d+\.\d+$/.test(value)) {
    throw new Error(`Invalid versionName (SemVer required): ${value}`);
  }
  return value;
}

function main() {
  const args = parseArgs(process.argv);
  const versionName = parseSemver(args["version-name"]);
  const versionCode = parseVersionCode(args["version-code"]);

  const appJsonPath = path.resolve("app.json");
  const data = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
  if (!data.expo || typeof data.expo !== "object") {
    throw new Error("Invalid app.json: missing expo root");
  }
  if (!data.expo.android || typeof data.expo.android !== "object") {
    data.expo.android = {};
  }

  data.expo.version = versionName;
  data.expo.android.versionCode = versionCode;

  fs.writeFileSync(appJsonPath, `${JSON.stringify(data, null, 2)}\n`);
  process.stdout.write(
    JSON.stringify({ versionName, versionCode, file: appJsonPath }, null, 2),
  );
}

main();
