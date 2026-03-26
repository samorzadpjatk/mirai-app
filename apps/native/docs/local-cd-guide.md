# Local CD Guide for Android

This guide explains how to run the Android Continuous Deployment (CD) pipeline locally, including automatic credential importing.

## Overview

The local CD pipeline includes:
- **Automatic credential importing** from JSON configuration files
- **Build verification** and signing
- **APK/AAB generation** with correct versioning
- **Upload to Google Play** tracks (internal, beta, production)
- **Promotion** between tracks without rebuilding

## Prerequisites

1. **System dependencies:**
   - macOS or Linux
   - `bash`
   - `bun` (for running scripts)
   - `bundle` (Ruby bundler for fastlane)
   - `jq` (JSON command-line processor)
   - Android NDK/SDK (if building locally)

2. **Configuration files:**
   - `apps/native/app.json` - Expo app configuration
   - `apps/native/credentials.json` - Android signing credentials
   - `apps/native/credentials/android/play-service-account.json` - Google Play API key

3. **Signing artifacts:**
   - Android keystore file (specified in credentials.json)
   - Google Play service account JSON key

## Automatic Credential Import

The local CD script automatically imports credentials from your JSON configuration files. This means you don't need to manually set environment variables.

### How it works

When you run the CD script, it:
1. Checks if all required environment variables are already set
2. If not, automatically runs `import_credentials_into_env.sh`
3. This script reads from `app.json` and `credentials.json` and exports the following:
   - `ANDROID_APP_PACKAGE`
   - `ANDROID_KEYSTORE_PATH`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`
   - `ANDROID_SIGNING_LINEAGE` (optional)
   - `PLAY_JSON_KEY_PATH`

### Credential structure

**apps/native/credentials.json structure:**

```json
{
  "android": {
    "keystore": {
      "keystorePath": "path/to/keystore.jks",
      "keystorePassword": "your-keystore-password",
      "keyAlias": "your-key-alias",
      "keyPassword": "your-key-password"
    },
    "signingLineagePath": "path/to/signing-lineage.pb" // optional
  }
}
```

**apps/native/app.json (Expo config):**

```json
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "package": "com.example.app"
    }
  }
}
```

## Running Local CD

### Basic usage

Build and upload to internal track:

```bash
cd apps/native
bun ./scripts/release/run-local-cd.js
```

The script will:
1. Automatically import credentials from JSON files
2. Determine the version bump
3. Build the APK/AAB
4. Upload to internal track on Google Play

### With version control

Specify commit range for version bumping:

```bash
cd apps/native
bun ./scripts/release/run-local-cd.js --from-ref v1.0.0 --to-ref HEAD
```

### Promotion to beta

Build internal and promote to beta:

```bash
cd apps/native
bun ./scripts/release/run-local-cd.js --promote-beta
```

This will:
1. Build and upload to internal track
2. Wait for your confirmation
3. Promote the version to beta track

### Promotion to production

Promote through all tracks to production:

```bash
cd apps/native
bun ./scripts/release/run-local-cd.js --promote-beta --promote-production
```

This will:
1. Build and upload to internal
2. Wait for confirmation, then promote to beta
3. Wait for confirmation, then promote to production

### Auto-approve promotions

Skip manual confirmation prompts:

```bash
cd apps/native
bun ./scripts/release/run-local-cd.js --promote-beta --promote-production --yes
```

### Skip credential import

If you've already set environment variables, skip the import:

```bash
cd apps/native
bun ./scripts/release/run-local-cd.js --skip-credential-import
```

## Credential Import Script

If you need to import credentials separately (not through the CD script):

```bash
bash apps/native/scripts/release/import_credentials_into_env.sh
```

This script:
- Works from any directory (uses absolute paths)
- Checks for required files before importing
- Validates `jq` is installed
- Exports all credentials as environment variables
- Can be sourced in other scripts

**Example usage in shell:**

```bash
# Source the credentials into the current shell
source apps/native/scripts/release/import_credentials_into_env.sh

# Now use the environment variables
echo $ANDROID_APP_PACKAGE
echo $ANDROID_KEYSTORE_PATH
```

## Troubleshooting

### Missing credentials error

If you see "Missing required file" or "Missing required environment variable" errors:

1. Verify `apps/native/credentials.json` exists with correct structure
2. Verify paths in credentials.json point to existing files
3. Check `apps/native/app.json` has `expo.android.package` set
4. Ensure `jq` is installed: `which jq`

### Path issues

If credentials import fails with path errors:

1. Use absolute paths in `credentials.json`
2. Or run the script from the project root:
   ```bash
   cd /path/to/pjapp
   bun apps/native/scripts/release/run-local-cd.js
   ```

### jq not found

Install jq:

```bash
# macOS
brew install jq

# Linux (Ubuntu/Debian)
sudo apt-get install jq

# Linux (Fedora/RHEL)
sudo dnf install jq
```

### Authentication failures

If uploads fail with "unauthorized" errors:

1. Verify `play-service-account.json` is valid
2. Check service account has correct Play Console permissions
3. Regenerate the service account key in Google Play Console

## Available Commands

```bash
# Show help
bun ./scripts/release/run-local-cd.js --help

# Basic release to internal
bun ./scripts/release/run-local-cd.js

# Release with specific commit range
bun ./scripts/release/run-local-cd.js --from-ref v1.0.0 --to-ref HEAD

# Release and promote to beta (with confirmation)
bun ./scripts/release/run-local-cd.js --promote-beta

# Full release through all tracks (with confirmation)
bun ./scripts/release/run-local-cd.js --promote-beta --promote-production

# Full release with auto-approval
bun ./scripts/release/run-local-cd.js --promote-beta --promote-production --yes

# Skip automatic credential import
bun ./scripts/release/run-local-cd.js --skip-credential-import
```

## Environment Variables

If you prefer to set environment variables manually (skipping automatic import):

```bash
export ANDROID_APP_PACKAGE="com.example.app"
export PLAY_JSON_KEY_PATH="/path/to/play-service-account.json"
export ANDROID_KEYSTORE_PATH="/path/to/keystore.jks"
export ANDROID_KEYSTORE_PASSWORD="keystore-password"
export ANDROID_KEY_ALIAS="key-alias"
export ANDROID_KEY_PASSWORD="key-password"
export ANDROID_SIGNING_LINEAGE="/path/to/signing-lineage.pb"  # optional

cd apps/native
bun ./scripts/release/run-local-cd.js --skip-credential-import
```

## Output Artifacts

After a successful build and upload:

- `dist/android/app-{version}-{versionCode}.aab` - The signed bundle
- `dist/android/release-metadata.json` - Build metadata with:
  - Version name and code
  - SHA256 hash of the artifact
  - Commit SHA
  - Signing lineage
  - Source track

## Security Notes

⚠️ **Important:** Never commit credentials files to version control. They should be:

- Stored in a secure location outside the repository
- Protected with appropriate file permissions (`chmod 600`)
- Only accessible to authorized developers
- Referenced via absolute paths in credentials.json

Consider using tools like:
- AWS Secrets Manager
- HashiCorp Vault
- 1Password / LastPass
- `.env` files with proper gitignore rules

