# Deployment Guide

## Overview

This document covers building and deploying the native app using EAS (Expo Application Services) and Fastlane.

## Build Profiles

Configured in `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": { "enterpriseProvisioning": "adhoc" }
    },
    "production": {}
  }
}
```

| Profile | Purpose | Distribution |
|---------|---------|--------------|
| `development` | Development client | Internal |
| `preview` | Testing | Internal / TestFlight |
| `production` | App Store | App Store / Play Store |

## EAS Build

### Development Build

For developing with custom native modules:

```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Preview Build

For testing before production:

```bash
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

### Production Build

For app stores:

```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

## Fastlane Automation

Fastlane handles the full release pipeline.

### Android

```bash
# Complete Android release
bun run release:android:release

# Individual steps
bun run release:android:build    # Build APK/AAB
bun run release:android:submit   # Upload to Play Store
bun run release:android:promote  # Promote to production
```

### iOS

```bash
# Complete iOS release
bun run release:ios:release

# Individual steps
bun run release:ios:build      # Build IPA
bun run release:ios:submit     # Upload to App Store
```

## Environment Setup

### EAS Credentials

```bash
# Login to EAS
eas login

# Configure credentials
eas credentials
```

### iOS Certificates

Fastlane Match (recommended):

```bash
cd fastlane
bundle exec fastlane ios match_init
```

### Android Keystore

```bash
# Generate keystore
keytool -genkey -v -keystore mirai.keystore -alias mirai -keyalg RSA -keysize 2048 -validity 10000

# Upload to EAS
eas credentials:manage --platform android
```

## App Store Configuration

### iOS App Store

1. Create app in [App Store Connect](https://appstoreconnect.apple.com)
2. Configure bundle ID: `com.mirai.app`
3. Set up signing certificates
4. Configure app information, screenshots

### Google Play Store

1. Create app in [Google Play Console](https://play.google.com/console)
2. Configure package name: `com.mirai.app`
3. Upload signing keystore
4. Set up store listing

## OTA Updates

Expo Updates provides over-the-air updates.

### Publishing Updates

```bash
# Publish to default channel
eas update --branch production

# Publish to specific channel
eas update --branch preview
```

### Update Channels

| Channel | Purpose |
|---------|---------|
| `production` | Live app users |
| `preview` | Beta testers |
| `development` | Internal testing |

### Runtime Version

Updates are only applied to matching runtime versions:

```json
// app.json
{
  "expo": {
    "runtimeVersion": {
      "policy": "sdkVersion"
    }
  }
}
```

## Release Checklist

### Before Building

- [ ] Version bumped in `package.json`
- [ ] Changelog updated
- [ ] Environment variables set
- [ ] Tests passing

### After Building

- [ ] Test build on device
- [ ] Verify all features work
- [ ] Check analytics/events
- [ ] Submit to stores

### Production Release

- [ ] Staged rollout (1% → 10% → 100%)
- [ ] Monitor crash reports
- [ ] Monitor performance
- [ ] Respond to reviews

## Troubleshooting

### Build Fails

```bash
# Clear all caches
rm -rf node_modules ios android .expo
bun install
```

### EAS Build Fails

```bash
# Check logs
eas build:logs

# Retry with clean build
eas build --clear-cache
```

### Code Signing Issues

```bash
# Reset iOS certificates
fastlane match nuke development
fastlane match nuke appstore

# Regenerate
cd fastlane && bundle exec fastlane ios match_init
```

## Further Reading

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Fastlane Documentation](https://docs.fastlane.tools/)
- [Expo Updates](https://docs.expo.dev/versions/latest/sdk/updates/)
