#!/bin/bash
set -e

echo "=== ci_post_clone.sh START ==="

# Z apps/native/ios/ci_scripts/ do root monorepo
cd $CI_PRIMARY_REPOSITORY_PATH

# Zapisz Package.resolved zanim prebuild go nadpisze
RESOLVED_SRC="$CI_PRIMARY_REPOSITORY_PATH/apps/native/ios/MIRAI.xcworkspace/xcshareddata/swiftpm/Package.resolved"
RESOLVED_BACKUP="/tmp/Package.resolved.bak"

if [ -f "$RESOLVED_SRC" ]; then
  cp "$RESOLVED_SRC" "$RESOLVED_BACKUP"
  echo "Package.resolved backed up"
fi

echo "Working dir: $(pwd)"

# Zainstaluj Node i CocoaPods przez Homebrew
export HOMEBREW_NO_AUTO_UPDATE=1
export HOMEBREW_NO_INSTALL_CLEANUP=TRUE
brew install node cocoapods

# Zainstaluj Bun (obsługuje workspace:*)
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Sprawdź czy bun jest dostępny
bun --version

# Zainstaluj dependencies przez Bun (nie npm!)
bun install
# lub: yarn install / pnpm install

# Wygeneruj zmienne środowiskowe (opcjonalnie)
echo "EXPO_PUBLIC_SUPABASE_URL=$EXPO_PUBLIC_SUPABASE_URL" >> apps/native/.env
echo "EXPO_PUBLIC_TRPC_API_URL=$EXPO_PUBLIC_TRPC_API_URL" >> apps/native/.env
echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=$EXPO_PUBLIC_SUPABASE_ANON_KEY" >> apps/native/.env

# Uruchom prebuild - generuje ios/ z .xcworkspace i robi pod install
# CI="true" (lowercase) naprawia bug GetEnv w Expo
cd apps/native
CI="true" bunx expo prebuild --platform ios --non-interactive

# Przywróć Package.resolved po prebuildzie
RESOLVED_DEST="$CI_PRIMARY_REPOSITORY_PATH/apps/native/ios/MIRAI.xcworkspace/xcshareddata/swiftpm"
mkdir -p "$RESOLVED_DEST"

if [ -f "$RESOLVED_BACKUP" ]; then
  cp "$RESOLVED_BACKUP" "$RESOLVED_DEST/Package.resolved"
  echo "Package.resolved restored"
fi

echo "=== ci_post_clone.sh END ==="
