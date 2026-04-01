#!/usr/bin/env bash
# generate_env.sh - Generate .env file for Android and iOS fastlane builds
# Expects credentials.json and app.json in the script directory

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CREDENTIALS_PATH="$SCRIPT_DIR/credentials.json"
APP_JSON_PATH="$SCRIPT_DIR/app.json"

get_json_value() {
    local file="$1"
    local key="$2"
    local default="${3:-}"
    if [[ ! -f "$file" ]]; then
        echo -n "$default"
        return
    fi
    local value
    value=$(jq -r ".$key // empty" "$file" 2>/dev/null) || true
    if [[ -n "$value" ]]; then
        echo -n "$value"
    else
        echo -n "$default"
    fi
}

file_to_base64() {
    local file="$1"
    if [[ -f "$file" ]]; then
        base64 < "$file" | tr -d '\n'
    fi
}

CREDENTIALS_DIR=$(dirname "$CREDENTIALS_PATH")

echo "# Android Fastlane environment variables"
ANDROID_APP_PACKAGE=$(get_json_value "$CREDENTIALS_PATH" "android.appPackage" "")
if [[ -z "$ANDROID_APP_PACKAGE" ]]; then
    ANDROID_APP_PACKAGE=$(get_json_value "$APP_JSON_PATH" "expo.android.package" "")
fi

ANDROID_KEYSTORE_PASSWORD=$(get_json_value "$CREDENTIALS_PATH" "android.keystore.keystorePassword" "")
ANDROID_KEY_ALIAS=$(get_json_value "$CREDENTIALS_PATH" "android.keystore.keyAlias" "")
ANDROID_KEY_PASSWORD=$(get_json_value "$CREDENTIALS_PATH" "android.keystore.keyPassword" "")
ANDROID_SIGNING_LINEAGE=$(get_json_value "$CREDENTIALS_PATH" "android.signingLineage" "")
if [[ -z "$ANDROID_SIGNING_LINEAGE" ]]; then
    ANDROID_SIGNING_LINEAGE="play-release"
fi

echo "ANDROID_APP_PACKAGE=$ANDROID_APP_PACKAGE"
echo "ANDROID_KEYSTORE_PASSWORD=$ANDROID_KEYSTORE_PASSWORD"
echo "ANDROID_KEY_ALIAS=$ANDROID_KEY_ALIAS"
echo "ANDROID_KEY_PASSWORD=$ANDROID_KEY_PASSWORD"
echo "ANDROID_SIGNING_LINEAGE=$ANDROID_SIGNING_LINEAGE"
echo ""

echo "# Android Base64-encoded secrets (for GitHub)"
echo "PLAY_JSON_KEY_BASE64=$(file_to_base64 "$CREDENTIALS_DIR/credentials/android/play-service-account.json")"
echo "ANDROID_KEYSTORE_BASE64=$(file_to_base64 "$CREDENTIALS_DIR/credentials/android/keystore.jks")"
echo "GOOGLE_SERVICES_JSON_BASE64=$(file_to_base64 "$CREDENTIALS_DIR/credentials/android/google-services.json")"
echo ""

echo "# iOS Fastlane environment variables"
IOS_BUNDLE_IDENTIFIER=$(get_json_value "$CREDENTIALS_PATH" "ios.bundleIdentifier" "")
if [[ -z "$IOS_BUNDLE_IDENTIFIER" ]]; then
    IOS_BUNDLE_IDENTIFIER=$(get_json_value "$APP_JSON_PATH" "expo.ios.bundleIdentifier" "")
fi

IOS_DIST_CERT_PASSWORD=$(get_json_value "$CREDENTIALS_PATH" "ios.distributionCertificate.password" "")

echo "IOS_BUNDLE_IDENTIFIER=$IOS_BUNDLE_IDENTIFIER"
echo "IOS_DIST_CERT_PASSWORD=$IOS_DIST_CERT_PASSWORD"
echo "IOS_ASC_KEY_ID="
echo "IOS_ASC_ISSUER_ID="
echo "IOS_ASC_KEY_CONTENT_BASE64="
echo ""

echo "# iOS Base64-encoded secrets (for GitHub)"
echo "IOS_PROFILE_MOBILEPROVISION_BASE64=$(file_to_base64 "$CREDENTIALS_DIR/credentials/ios/profile.mobileprovision")"
echo "IOS_DIST_CERT_P12_BASE64=$(file_to_base64 "$CREDENTIALS_DIR/credentials/ios/dist-cert.p12")"
