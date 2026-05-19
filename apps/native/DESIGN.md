# PJApp Native — Design System (Platform Override)

> **Document purpose:** Native mobile implementation of the MIRAI Design System. This document extends the root `DESIGN.md` with iOS/Android-specific implementation details.
> **Parent document:** [`../../DESIGN.md`](../../DESIGN.md)
> **Last updated:** 2025-05-19

---

## 1. Platform Context

| Property | Value |
|---|---|
| **Platform** | iOS & Android |
| **Framework** | Expo SDK 55 + React Native 0.83 |
| **Router** | Expo Router 6 (file-based) |
| **Style engine** | Tailwind CSS 3.4 + NativeWind 4.2 |
| **Fallback engine** | React Native `StyleSheet` |
| **Font** | IBM Plex Sans (100–700) via `@expo-google-fonts/ibm-plex-sans` |
| **Icons** | `@expo/vector-icons` (Ionicons), Expo Image SF Symbols |
| **Animations** | `react-native-reanimated` |

---

## 2. Token Implementation

All design tokens from the root `DESIGN.md` are implemented as TypeScript constants in `src/styles/`. These are the source of truth for the native app.

### 2.1 File Index

| Token File | Exports | Count |
|---|---|---|
| `src/styles/colors.ts` | Color tokens + opacity variants | 173 |
| `src/styles/spacing.ts` | `spacing` + `borderRadius` | 12 |
| `src/styles/typography.ts` | Font sizes, weights, line heights | 12 |
| `src/styles/shadows.ts` | Cross-platform shadow objects | 6 |
| `src/styles/commonStyles.ts` | Pre-built StyleSheet presets | 35+ |
| `src/styles/judgement.ts` | Domain-specific moderation styles | 30+ |
| `src/styles/index.ts` | Barrel export + `theme` object | — |

### 2.2 Usage Pattern

```tsx
import { colors, spacing, typography, shadows, borderRadius } from "~/styles";

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundDark,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.xxxl,
    fontWeight: typography.bold,
    color: colors.white,
  },
  card: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.md,
    ...shadows.medium,
  },
});
```

### 2.3 Theme Object

```tsx
import { theme } from "~/styles";

// Access all tokens via theme
const bg = theme.colors.backgroundDark;
const pad = theme.spacing.lg;
```

---

## 3. Typography

### 3.1 Font Loading

Fonts are loaded at app startup in `src/app/_layout.tsx`:

```tsx
import {
  IBMPlexSans_100Thin,
  IBMPlexSans_200ExtraLight,
  IBMPlexSans_300Light,
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
  useFonts,
} from "@expo-google-fonts/ibm-plex-sans";

const [fontsLoaded] = useFonts({
  IBMPlexSans_100Thin,
  IBMPlexSans_200ExtraLight,
  IBMPlexSans_300Light,
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
});
```

### 3.2 Native-Specific Scale

The native app implements the root scale 1:1 with these additions:

| Token | Size | Native-Specific |
|---|---|---|
| `xs` | 10px | Labels, badges |
| `sm` | 12px | Secondary text |
| `base` | 14px | Body |
| `lg` | 16px | Buttons, card titles |
| `xl` | 18px | Sub-headings |
| `xxl` | 20px | Emphasized |
| `xxxl` | 24px | H2 |
| `huge` | 36px | H1 hero |

Weights map directly to the loaded font files:
- `light` → 300
- `normal` → 400
- `medium` → 500
- `semibold` → 600
- `bold` → 700

---

## 4. Shadows & Elevation

Native shadows must define both iOS `shadow-*` properties and Android `elevation`:

```ts
export const shadows = {
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,  // Android
  },
  primaryGlow: {
    shadowColor: "#00ced1",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
};
```

**Usage:** Spread into StyleSheet objects: `...shadows.medium`

---

## 5. Tailwind / NativeWind Integration

### 5.1 Config (`tailwind.config.cjs`)

```js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#00ced1",
        "accent-pink": "#E533FF",
        "background-light": "#f1f1f4",
        "background-dark": "#17181c",
        "surface-dark": "#272935",
        "border-dark": "#395556",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
      },
    },
  },
};
```

### 5.2 Global CSS

Both `global.css` and `src/global.css` contain Tailwind directives:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Plus a `.bento-grid` utility for grid layouts.

### 5.3 When to Use What

| Approach | When to Use |
|---|---|
| **Tailwind classes** | Quick prototyping, utility-first layout |
| **`StyleSheet.create` + tokens** | Complex components, dynamic values, animations |
| **`commonStyles`** | Standard cards, buttons, text patterns |

---

## 6. Component Library

### 6.1 Reusable UI Components

Located in `src/components/common/ui/`:

| Component | File | Props |
|---|---|---|
| **ThemedCard** | `ThemedCard.tsx` | `children`, `onPress?`, `bordered?`, `selected?`, `variant?` |
| **ThemedListItem** | `ThemedListItem.tsx` | `title`, `subtitle?`, `leftAvatar?`, `rightElement?`, `onPress?` |
| **EmptyState** | `EmptyState.tsx` | `icon?`, `title`, `subtitle?`, `iconSize?`, `iconColor?` |
| **PrimaryLoadingButton** | `buttons/PrimaryLoadingButton.tsx` | `label`, `isLoading`, `onPress`, `disabled?` |
| **FloatingActionButton** | `FloatingActionButton.tsx` | `onPress`, `iconName`, `accessibilityLabel` |

### 6.2 Common Styles (`commonStyles.ts`)

Pre-built StyleSheet objects for rapid development:

```ts
// Containers
commonStyles.container      // flex:1, backgroundDark
commonStyles.card           // cardDark bg, bordered, padded
commonStyles.cardGlass      // translucent + primary border

// Typography
commonStyles.h1, h2, h3, h4
commonStyles.textPrimary, textSecondary
commonStyles.label, labelPrimary

// Buttons
commonStyles.button, buttonText

// Utilities
commonStyles.flexRow, flexCenter, flexBetween
commonStyles.gap4, gap8, gap12, gap16, gap24
commonStyles.p16, p24, px16, py16
commonStyles.mb8, mb12, mb16, mb24
commonStyles.borderPrimary, borderWhite5
commonStyles.shadowSmall, shadowMedium, shadowLarge, shadowXL, shadowPrimaryGlow
```

### 6.3 Component Variants

**ThemedCard variants:**
- `default` — `cardDark` bg, transparent border
- `bordered` — adds `borderDark` border
- `selected` — `primaryOpacity10` bg + `primary` border
- `interactive` — `primaryOpacity10` bg (hoverable)

**ThemedListItem:**
- Background: `primaryOpacity10`
- Avatar wrapper: 52×52, `borderRadius: 26`, `primaryOpacity30` border
- Title: `white`, semibold, 14px
- Subtitle: `textSecondary`, 12px

---

## 7. Navigation

### 7.1 Stack Navigation

Configured in `src/app/_layout.tsx`:
- Header: Hidden by default (`headerShown: false`)
- Background: `colors.backgroundDark`
- Tint: `colors.textPrimary` (white)
- Gesture: Horizontal swipe

### 7.2 Tab Navigation

Configured in `src/app/(tabs)/_layout.tsx` using `expo-router/unstable-native-tabs`:

| Tab | iOS Icon | Android Icon | Label |
|---|---|---|---|
| Community | `person.2.fill` (SF Symbol) | `people` (Ionicons) | Community |
| Trips | `snowflake` | `ac_unit` | Trips |
| Notifications | `bell.fill` | `notifications` | Notifications |
| Profile | `person.fill` | `person` | Profile |
| Admin | `gearshape.fill` | `settings` | Admin (conditional) |

**Tab bar theming:**
- Background: `backgroundDark`
- Active tint: `primary` (#00ced1)
- Inactive tint: `#8E8E93`

### 7.3 Back Button

Standard back button style:
- Size: 40×40px
- Background: `cardDark`
- Border: 1px `borderDark`
- Border radius: `md` (12px)
- Icon: System chevron or custom arrow

---

## 8. Domain-Specific Patterns

### 8.1 Judgement / Moderation UI

Located in `src/styles/judgement.ts`:
- Card stack with swipeable cards
- Approve/reject stamp overlays
- Fullscreen image viewer
- Reject-reason modal with textarea input

**Action buttons:**
- Approve: 64×64 circle, `primary` background
- Reject: 64×64 circle, `red400` background

### 8.2 Trip Hero Cards

Used for trip/event hero banners:
- Height: 192px
- Gradient overlay: `rgba(23, 24, 28, 0.6)`
- Bottom-aligned text content
- Optional background image with darkening layer
- Badge: pill-shaped status indicator

### 8.3 Status Colors

| Status | Color | Hex |
|---|---|---|
| Hidden | `textTertiary` | `#64748b` |
| Visible | `info` | `#0ea5e9` |
| Active | `success` | `#22c55e` |
| Voting Phase | `warning` | `#f59e0b` |
| Completed | `success` | `#10b981` |

---

## 9. Platform-Specific Rules

### 9.1 iOS

- Use `PlatformColor("label")` for system-aware text where applicable
- Use `{ borderCurve: 'continuous' }` for Apple-style rounded corners (iOS 16+)
- Support SF Symbols via `expo-image` (`source="sf:name"`)
- Enable haptics via `expo-haptics` for delightful interactions
- Use `headerLargeTitle: true` for immersive navigation

### 9.2 Android

- Elevation shadows are handled via the `elevation` property (included in all shadow tokens)
- Use `@react-native-community/datetimepicker` for native pickers
- Material-style ripple effects on pressables (built into React Native)
- Use `TouchableNativeFeedback` for platform-standard ripple on Android

### 9.3 Cross-Platform

- **Safe areas:** Use `useSafeAreaInsets()` from `react-native-safe-area-context`
- **Scroll views:** Use `contentInsetAdjustmentBehavior="automatic"` instead of `SafeAreaView`
- **Dimensions:** Use `useWindowDimensions` instead of `Dimensions.get()`
- **Platform check:** Use `process.env.EXPO_OS` instead of `Platform.OS`

---

## 10. Assets & Icons

| Asset | Location | Usage |
|---|---|---|
| App Logo | `assets/mirai_logo.png` | Splash, navbar, auth screens |
| Icons | `@expo/vector-icons` (Ionicons) | UI icons throughout |
| SF Symbols | `expo-image` with `source="sf:name"` | iOS-native icons |

---

## 11. Best Practices

1. **Always import from `~/styles`** — Never hardcode colors, spacing, or typography values
2. **Spread shadow objects** — `...shadows.medium` ensures cross-platform consistency
3. **Compose `commonStyles`** — Use `[commonStyles.card, styles.custom]` pattern
4. **Use `borderRadius.full` for circles** — 9999px ensures perfect rounding across platforms
5. **Add `selectable` prop** to `<Text>` for user-selectable data
6. **Use `contentInsetAdjustmentBehavior="automatic"`** on ScrollViews for safe area
7. **Minimum touch target:** 44×44px for all interactive elements
8. **Tabular nums:** Use `fontVariant: 'tabular-nums'` for counters and numbers
9. **Prefer flex gap** over margin and padding where possible
10. **Use kebab-case** for all file names (e.g., `comment-card.tsx`)

---

## 12. Deviations from Root Design System

The native app follows the root `DESIGN.md` with no significant deviations. The only platform-specific additions are:

1. **Shadow system** — Native requires dual-definition (iOS shadows + Android elevation)
2. **Font loading** — Fonts are loaded at runtime via `useFonts` hook (Expo-specific)
3. **Safe area handling** — Native-specific `react-native-safe-area-context` integration
4. **Icon system** — Dual icon set: Ionicons for cross-platform, SF Symbols for iOS

---

## 13. File Structure

```
apps/native/
├── DESIGN.md                    # This file
├── tailwind.config.cjs           # Tailwind + NativeWind config
├── global.css                    # Root CSS entry
├── src/
│   ├── global.css               # Tailwind directives + Bento grid
│   ├── styles/
│   │   ├── colors.ts            # 173 color tokens
│   │   ├── spacing.ts           # Spacing & border radius
│   │   ├── typography.ts        # Font sizes, weights, line heights
│   │   ├── shadows.ts           # Cross-platform shadows
│   │   ├── commonStyles.ts      # Reusable StyleSheet presets
│   │   ├── judgement.ts         # Domain-specific moderation styles
│   │   ├── index.ts             # Barrel export + theme object
│   │   └── README.md            # Polish-language style guide (legacy)
│   ├── components/
│   │   ├── common/
│   │   │   ├── ui/
│   │   │   │   ├── ThemedCard.tsx
│   │   │   │   ├── ThemedListItem.tsx
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   └── ...
│   │   │   ├── buttons/
│   │   │   │   ├── PrimaryLoadingButton.tsx
│   │   │   │   └── PrimaryAddButton.tsx
│   │   │   └── FloatingActionButton.tsx
│   │   ├── Logo.tsx
│   │   ├── AppNavbar.tsx
│   │   └── LoadingScreen.tsx
│   └── app/
│       ├── _layout.tsx          # Root layout + providers + fonts
│       └── (tabs)/
│           └── _layout.tsx      # Tab navigation
```

---

## 14. References

| Resource | URL |
|---|---|
| Root Design System | [`../../DESIGN.md`](../../DESIGN.md) |
| Google Labs DESIGN.md Spec | https://github.com/google-labs-code/design.md |
| NativeWind Documentation | https://nativewind.dev |
| Expo Documentation | https://docs.expo.dev |
| React Native Documentation | https://reactnative.dev |
| IBM Plex Sans | https://fonts.google.com/specimen/IBM+Plex+Sans |

---

*Parent: [MIRAI Design System](../../DESIGN.md)*
*Maintainers: PJApp Frontend Team*
*License: AGPL-3.0*
