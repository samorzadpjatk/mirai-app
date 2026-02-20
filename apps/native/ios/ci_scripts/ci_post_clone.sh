#!/bin/bash
set -e

echo "=== ci_post_clone.sh START ==="

# Z apps/native/ios/ci_scripts/ do root monorepo
cd $CI_PRIMARY_REPOSITORY_PATH

echo "Working dir: $(pwd)"

# Zainstaluj node i cocoapods (Xcode Cloud nie ma ich domyślnie)
brew install node cocoapods

# Zainstaluj node_modules (z root monorepo)
npm install
# lub: yarn install / pnpm install

# Wygeneruj zmienne środowiskowe (opcjonalnie)
echo "EXPO_PUBLIC_SUPABASE_URL=$EXPO_PUBLIC_SUPABASE_URL" >> apps/native/.env
echo "EXPO_PUBLIC_TRPC_API_URL=$EXPO_PUBLIC_TRPC_API_URL" >> apps/native/.env
echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=$EXPO_PUBLIC_SUPABASE_ANON_KEY" >> apps/native/.env

# Uruchom prebuild - generuje ios/ z .xcworkspace i robi pod install
# CI="true" (lowercase) naprawia bug GetEnv w Expo
cd apps/native
CI="true" npx expo prebuild --platform ios --non-interactive

echo "=== ci_post_clone.sh END ==="
