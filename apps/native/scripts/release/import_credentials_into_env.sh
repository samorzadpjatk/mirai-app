#!/usr/bin/env bash
# set -euo pipefail

# --- Determine script location to support running from any directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../" && pwd)"

# --- Define file paths relative to project root
APP_JSON="$PROJECT_ROOT/app.json"
CREDENTIALS_JSON="$PROJECT_ROOT/credentials.json"
export PLAY_JSON_KEY_PATH="$PROJECT_ROOT/credentials/android/play-service-account.json"

# --- Check if jq is available
if ! command -v jq &>/dev/null; then
  echo "Error: jq is required but not installed" >&2
  exit 1
fi

# --- Sanity checks
for file in "$APP_JSON" "$CREDENTIALS_JSON" "$PLAY_JSON_KEY_PATH"; do
  if [[ ! -f "$file" ]]; then
    echo "Error: Missing required file: $file" >&2
    exit 1
  fi
done

# --- Export Android package
export ANDROID_APP_PACKAGE=$(jq -r '.expo.android.package' "$APP_JSON")

# --- Export keystore values
export ANDROID_KEYSTORE_PATH=$(jq -r '.android.keystore.keystorePath' "$CREDENTIALS_JSON")
export ANDROID_KEYSTORE_PASSWORD=$(jq -r '.android.keystore.keystorePassword' "$CREDENTIALS_JSON")
export ANDROID_KEY_ALIAS=$(jq -r '.android.keystore.keyAlias' "$CREDENTIALS_JSON")
export ANDROID_KEY_PASSWORD=$(jq -r '.android.keystore.keyPassword' "$CREDENTIALS_JSON")

# --- Optional: signing lineage (if used)
if jq -e '.android.signingLineagePath' "$CREDENTIALS_JSON" >/dev/null 2>&1; then
  export ANDROID_SIGNING_LINEAGE=$(jq -r '.android.signingLineagePath' "$CREDENTIALS_JSON")
fi

echo "$ANDROID_APP_PACKAGE"
echo "Android Fastlane environment variables loaded successfully"
