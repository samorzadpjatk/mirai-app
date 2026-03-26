#!/usr/bin/env bun
/**
 * Import Android credentials from JSON configuration files into environment variables.
 *
 * This script reads:
 * - apps/native/app.json (Expo configuration)
 * - apps/native/credentials.json (Android signing credentials)
 *
 * And exports the following environment variables:
 * - ANDROID_APP_PACKAGE
 * - ANDROID_KEYSTORE_PATH
 * - ANDROID_KEYSTORE_PASSWORD
 * - ANDROID_KEY_ALIAS
 * - ANDROID_KEY_PASSWORD
 * - ANDROID_SIGNING_LINEAGE (optional)
 * - PLAY_JSON_KEY_PATH
 *
 * Works from any directory and supports being sourced or executed.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

interface AppConfig {
  expo?: {
    android?: {
      package?: string;
    };
  };
}

interface KeystoreConfig {
  keystorePath?: string;
  keystorePassword?: string;
  keyAlias?: string;
  keyPassword?: string;
}

interface CredentialsConfig {
  android?: {
    keystore?: KeystoreConfig;
    signingLineagePath?: string;
  };
}

function getProjectRoot(): string {
  // Get the directory of this script
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  // Navigate up to project root: scripts/release -> scripts -> native -> apps -> root
  const projectRoot = path.resolve(scriptDir, "../../../../");
  return projectRoot;
}

function loadJsonFile(filePath: string): Record<string, any> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
    }
    throw error;
  }
}

function validateRequiredField(
  value: string | undefined,
  fieldName: string,
): string {
  if (!value || !value.trim()) {
    throw new Error(`Missing required field: ${fieldName}`);
  }
  return value;
}

function main(): void {
  try {
    const projectRoot = getProjectRoot();

    // Define file paths
    const appJsonPath = path.join(projectRoot, "apps/native/app.json");
    const credentialsJsonPath = path.join(
      projectRoot,
      "apps/native/credentials.json",
    );
    const playServiceAccountPath = path.join(
      projectRoot,
      "apps/native/credentials/android/play-service-account.json",
    );

    // Validate files exist
    const requiredFiles = [
      { path: appJsonPath, name: "app.json" },
      { path: credentialsJsonPath, name: "credentials.json" },
      { path: playServiceAccountPath, name: "play-service-account.json" },
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file.path)) {
        throw new Error(
          `Missing required file: ${file.name}\n  Expected at: ${file.path}`,
        );
      }
    }

    // Load configuration files
    const appConfig = loadJsonFile(appJsonPath) as AppConfig;
    const credentialsConfig = loadJsonFile(
      credentialsJsonPath,
    ) as CredentialsConfig;

    // Extract and validate Android package
    const androidPackage = appConfig.expo?.android?.package;
    const validatedPackage = validateRequiredField(
      androidPackage,
      "expo.android.package in app.json",
    );

    // Extract and validate keystore configuration
    const keystore = credentialsConfig.android?.keystore;
    if (!keystore) {
      throw new Error(
        "Missing android.keystore configuration in credentials.json",
      );
    }

    const keystorePath = validateRequiredField(
      keystore.keystorePath,
      "android.keystore.keystorePath",
    );
    const keystorePassword = validateRequiredField(
      keystore.keystorePassword,
      "android.keystore.keystorePassword",
    );
    const keyAlias = validateRequiredField(
      keystore.keyAlias,
      "android.keystore.keyAlias",
    );
    const keyPassword = validateRequiredField(
      keystore.keyPassword,
      "android.keystore.keyPassword",
    );

    // Resolve keystore path (relative to project root if not absolute)
    let resolvedKeystorePath: string;
    if (path.isAbsolute(keystorePath)) {
      resolvedKeystorePath = keystorePath;
    } else {
      // Try relative to project root first
      const projectRootPath = path.join(projectRoot, keystorePath);
      // If not found, try relative to native app directory
      const nativeAppPath = path.join(projectRoot, "apps/native", keystorePath);

      resolvedKeystorePath = fs.existsSync(projectRootPath)
        ? projectRootPath
        : nativeAppPath;
    }

    // Validate keystore file exists
    if (!fs.existsSync(resolvedKeystorePath)) {
      throw new Error(`Keystore file not found: ${resolvedKeystorePath}`);
    }

    // Set environment variables
    process.env.ANDROID_APP_PACKAGE = validatedPackage;
    process.env.ANDROID_KEYSTORE_PATH = resolvedKeystorePath;
    process.env.ANDROID_KEYSTORE_PASSWORD = keystorePassword;
    process.env.ANDROID_KEY_ALIAS = keyAlias;
    process.env.ANDROID_KEY_PASSWORD = keyPassword;
    process.env.PLAY_JSON_KEY_PATH = playServiceAccountPath;

    // Optional: signing lineage
    if (credentialsConfig.android?.signingLineagePath) {
      process.env.ANDROID_SIGNING_LINEAGE =
        credentialsConfig.android.signingLineagePath;
    }

    // Output to stdout so parent scripts can capture if needed
    console.log(validatedPackage);
    console.log("Android Fastlane environment variables loaded successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

main();
