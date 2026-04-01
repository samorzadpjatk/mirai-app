## Why

The Astro web admin panel and React Native mobile admin panel should feel like the same application. Currently, the web uses a light theme with blue primary colors and a desktop sidebar layout, while the native app uses a dark theme with cyan/magenta accents and a tile-based dashboard. This visual inconsistency undermines brand identity and confuses users switching between platforms.

## What Changes

- **Full dark mode** for web admin to match native app's dark theme (`#17181c` background, `#1b2828` cards)
- **Replace sidebar navigation** with tile-based dashboard layout matching native app
- **Shared design tokens** extracted to `packages/shared/design-tokens/` for cross-platform consistency
- **Ionicons integration** in web to replace emoji icons
- **Per-tile accent colors** matching native (cyan for Users/Transactions/Challenges, magenta for Coins/Notifications/Rewards, slate for Groups/Activity)
- **Typography alignment** using Space Grotesk display font and native app's type scale

## Capabilities

### New Capabilities

- `design-tokens`: Cross-platform design tokens package defining colors, spacing, typography, and border radii that both native and web can consume
- `web-dark-theme`: Dark mode implementation for Astro web admin using Tailwind v4 `@theme` directive
- `web-tile-navigation`: Tile-based dashboard navigation replacing sidebar, with mobile-first responsive layout

### Modified Capabilities

<!-- No existing spec-level requirements are changing - this is purely visual/structural -->

## Impact

- **`packages/shared/`**: New `design-tokens/` directory with TypeScript constants
- **`apps/admin-web/src/styles/global.css`**: Tailwind theme updated to dark mode colors
- **`apps/admin-web/src/components/`**:
  - `AdminApp.tsx` - Remove sidebar layout, add mobile nav
  - `Sidebar.tsx` - Remove or repurpose for mobile drawer
  - `Dashboard.tsx` - Update to dark styling
  - `AdminTile.tsx` - Add Ionicons, per-tile accent colors
- **`apps/native/src/styles/`**: Import tokens from shared package (optional refactor)
- **Dependencies**: Add `react-icons` (for Ionicons on web) to admin-web
