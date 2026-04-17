# Tamagui Migration Analysis

**Generated**: 2026-04-14  
**Analyzer**: sdd:code-explorer  
**Scope**: Full codebase migration from Tailwind/NativeWind/StyleSheet to Tamagui

---

## Executive Summary

Migrating from custom UI to Tamagui requires creating a unified component library in `packages/ui/` that serves both web and native applications. The migration involves **148 native components**, **96 web components**, and significant build configuration changes.

**Risk Level: MEDIUM-HIGH**

- High component count across platforms
- NativeWind hybrid usage requires careful migration
- Build tooling complexity (Metro + Vite)

---

## Files to Modify

### Web App (apps/web/)

**UI Primitives** (9 files):

- `src/components/ui/Button.tsx` - 37 lines, Tailwind variants
- `src/components/ui/Card.tsx` - 18 lines, simple container
- `src/components/ui/Input.tsx` - 41 lines, label + error handling
- `src/components/ui/Select.tsx` - 57 lines, dropdown component
- `src/components/ui/Modal.tsx` - 43 lines, dialog with overlay
- `src/components/ui/LoadingSpinner.tsx` - 17 lines, spinner with label
- `src/components/ui/TimeInput.tsx` - needs review
- `src/components/ui/DateInput.tsx` - needs review
- `src/components/ui/ErrorMessage.tsx` - 17 lines, alert box

**Design Tokens** (5 files):

- `src/design-tokens/colors.ts` - 179 lines, comprehensive palette
- `src/design-tokens/typography.ts` - 57 lines, font sizes/weights
- `src/design-tokens/spacing.ts` - needs review
- `src/design-tokens/borderRadius.ts` - needs review
- `src/design-tokens/index.ts` - 16 lines, barrel export

**Configuration** (2 files):

- `package.json` - Remove Tailwind deps, add Tamagui
- `astro.config.mjs` - Replace Tailwind plugin with Tamagui
- `tsconfig.json` - Add packages/ui path alias
- `src/styles/global.css` - Convert to Tamagui theme injection

**Component Consumers** (~15 files estimated):

- Components importing from `@/components/ui/*` (need to verify usage)

### Native App (apps/native/)

**Style System** (7 files to migrate/deprecate):

- `src/styles/colors.ts` - 173 lines, 109 imports across codebase
- `src/styles/typography.ts` - 60+ imports
- `src/styles/spacing.ts` - 70+ imports
- `src/styles/borderRadius.ts` - 40+ imports
- `src/styles/shadows.ts` - 15+ imports
- `src/styles/commonStyles.ts` - 191 lines, StyleSheet patterns
- `src/styles/index.ts` - barrel export

**Component Files** (148 TSX files, gradual migration):

- **HIGH USAGE** (import colors, spacing, typography):
  - `src/components/trips/**/*` - 45+ files
  - `src/components/common/**/*` - 20+ files
  - `src/components/groups/**/*` - 25+ files
  - `src/components/challenges/**/*` - 15+ files
  - `src/components/profile/**/*` - 5 files
  - `src/components/alerts/**/*` - 3 files

**Configuration** (3 files):

- `package.json` - Remove NativeWind/Tailwind, add Tamagui
- `metro.config.js` - Add Tamagui Metro plugin
- `babel.config.js` - Add Tamagui Babel plugin
- `tsconfig.json` - Add packages/ui path alias

**NativeWind-Heavy Components** (require special attention):

- `src/components/TopBar.tsx` - Uses className with NativeWind
- Need to audit for additional NativeWind className usage

### Shared Package (packages/)

**New Package Creation**:

- Create `packages/ui/` directory structure
- Configure package.json with dual build targets
- Setup TypeScript for cross-platform types

---

## Files to Create

### New Package: packages/ui/

**Configuration Files**:

```
packages/ui/
├── package.json                    # Dual platform dependencies
├── tsconfig.json                   # Shared TypeScript config
├── tamagui.config.ts               # Main Tamagui configuration
├── vite.config.ts                  # Build config for web
└── README.md                       # Usage documentation
```

**Theme Tokens** (unified cross-platform):

```
packages/ui/src/theme/
├── tokens.ts                       # Spacing, radii, z-index
├── colors.ts                       # Unified color palette
├── fonts.ts                        # Font family definitions
└── index.ts                        # Theme barrel export
```

**Primitive Components** (web + native):

```
packages/ui/src/components/
├── Button.tsx                      # Primary/secondary/ghost/danger variants
├── Card.tsx                        # Container with theming
├── Input.tsx                       # Text input with label/error
├── Select.tsx                      # Dropdown/select component
├── Sheet.tsx                       # Modal/sheet for both platforms
├── Spinner.tsx                     # Loading indicator
├── Text.tsx                        # Typography component
└── index.ts                        # Components barrel export
```

**Styling Utilities**:

```
packages/ui/src/
├── styled.tsx                      # Tamagui styled() wrappers
├── hooks/
│   └── useTheme.ts                 # Theme access hook
└── utils/
    └── platform.ts                 # Platform-specific helpers
```

---

## Files to Delete

### After Migration Complete

**Web App**:

- `apps/web/src/components/ui/` - Entire directory (9 files)
  - Migrated to packages/ui/src/components/
- `apps/web/src/design-tokens/` - Entire directory (5 files)
  - Migrated to packages/ui/src/theme/

**Native App**:

- `apps/native/src/styles/` - Entire directory (7 files)
  - Migrated to packages/ui/src/theme/
- Remove NativeWind style handling from babel/metro configs

---

## Integration Points

### 1. Theme Integration

**Location**: apps/web/src/styles/global.css → packages/ui/tamagui.config.ts
**Complexity**: MEDIUM
**Details**:

- Convert CSS custom properties (--color-primary) to Tamagui theme tokens
- Map Tailwind spacing scale to Tamagui space tokens
- Preserve dark theme as default
- Maintain typography font families (Space Grotesk, Inter)

**Key Mappings**:

```css
/* Current CSS → Tamagui Theme */
--color-primary: #00ced1 → theme.color.primary --color-background: #17181c →
  theme.color.background --radius-md: 12px → theme.radius.md --space-md: 12px →
  theme.space.md;
```

### 2. Component API Compatibility

**Location**: apps/web/src/components/ui/_.tsx → packages/ui/src/components/_.tsx
**Complexity**: LOW-MEDIUM
**Details**:

- Button variant mapping: primary/secondary/ghost/danger → Tamagui button props
- Input label/error props → Tamagui Form + Input composition
- Card → Tamagui Card with styled props
- Modal → Tamagui Sheet (mobile) or Dialog (web)

### 3. Native Style Migration

**Location**: apps/native/src/styles/_ → packages/ui/src/theme/_
**Complexity**: HIGH
**Details**:

- `colors` object (flat structure) → Tamagui color tokens
- `commonStyles` StyleSheet → Tamagui styled() components
- Gradual migration needed to prevent breaking changes
- 109 files import from `~/styles` - update imports progressively

**Import Path Changes**:

```typescript
// Before
import { colors, spacing } from "~/styles";

// After
import { tokens } from "@mirai-app/ui";
// or
import { styled, YStack, Text } from "@mirai-app/ui";
```

---

## Risk Areas

### 1. NativeWind Hybrid Components (HIGH RISK)

**Affected**: TopBar.tsx, potentially others
**Issue**: Components using `className` with NativeWind utilities
**Mitigation**:

- Audit all NativeWind className usage
- Migrate hybrid components first
- Provide Tamagui equivalent styled components

### 2. Color System Divergence (MEDIUM RISK)

**Affected**: All color imports across 109+ files
**Issue**: Web uses nested objects, native uses flat naming
**Example**:

```typescript
// Web: colors.border.white5
// Native: colors.borderWhite5
```

**Mitigation**:

- Create unified color naming in Tamagui theme
- Map both conventions during transition
- Codemod for automatic import updates

### 3. Testing Impact (MEDIUM RISK)

**Affected**: Native Jest tests, Web component tests
**Issue**: Tamagui adds component complexity, may affect snapshots
**Mitigation**:

- Update Jest config for Tamagui transformation
- Use @tamagui/jest-plugin if available
- Snapshot updates expected during migration

### 4. Build Tooling (MEDIUM RISK)

**Affected**: Metro (native), Vite (web)
**Issue**: Two different bundlers need Tamagui integration
**Mitigation**:

- Metro: @tamagui/metro-plugin
- Vite: @tamagui/vite-plugin
- Test builds on both platforms after each phase

### 5. React Native Web Compatibility (LOW RISK)

**Affected**: Web build of Tamagui components
**Issue**: Some RN primitives may not translate cleanly to web
**Mitigation**:

- Use Tamagui's cross-platform primitives (View → YStack, Text → Text)
- Test SSR compatibility with Astro

---

## Estimated Complexity per Component

### Web UI Primitives (9 components) - LOW

| Component      | Lines | Complexity | Notes                             |
| -------------- | ----- | ---------- | --------------------------------- |
| Button         | 37    | Low        | Direct Tamagui.Button replacement |
| Card           | 18    | Low        | Simple styled container           |
| Input          | 41    | Low        | Tamagui.Input + Form.Label        |
| Select         | 57    | Low        | Tamagui.Select                    |
| Modal          | 43    | Medium     | Sheet for mobile, Dialog for web  |
| LoadingSpinner | 17    | Low        | Tamagui.Spinner                   |
| TimeInput      | ?     | Medium     | Custom time picker                |
| DateInput      | ?     | Medium     | Custom date picker                |
| ErrorMessage   | 17    | Low        | Styled text component             |

### Design Tokens - MEDIUM

| Token File   | Complexity | Notes                          |
| ------------ | ---------- | ------------------------------ |
| Colors       | Medium     | Unify naming conventions       |
| Typography   | Low        | Direct mapping to fonts config |
| Spacing      | Low        | Direct token mapping           |
| BorderRadius | Low        | Direct token mapping           |

### Native Components - HIGH

| Category             | File Count | Complexity | Notes                      |
| -------------------- | ---------- | ---------- | -------------------------- |
| Trip Components      | 45         | High       | Heavy style imports        |
| Common/UI            | 20         | Medium     | Reusable pattern migration |
| Group Components     | 25         | High       | Complex layouts            |
| Challenge Components | 15         | High       | Custom styling             |
| Profile Components   | 5          | Low        | Simple layouts             |
| Other                | 38         | Medium     | Mixed complexity           |

---

## Files Affected Summary

| Action     | Count | Details                                       |
| ---------- | ----- | --------------------------------------------- |
| **Modify** | ~165  | 9 web UI + 148 native components + 8 config   |
| **Create** | ~15   | New packages/ui structure + config            |
| **Delete** | ~21   | Legacy UI dirs + token files (post-migration) |

---

## Top 3 Integration Points

1. **Theme Token Unification** (CRITICAL)
   - Merge web design-tokens and native styles into single Tamagui theme
   - Resolve color naming divergence (nested vs flat)
   - 109+ native files depend on this

2. **Native Components Migration** (CRITICAL)
   - Gradual refactor of 148 native components
   - Replace `~/styles` imports with `@mirai-app/ui`
   - Handle NativeWind hybrid components first

3. **Build Tooling Integration** (HIGH)
   - Configure Metro for Tamagui (native)
   - Configure Vite for Tamagui (web)
   - Ensure SSR compatibility with Astro

---

## Recommended Migration Phases

### Phase 1: Foundation (Week 1)

- Create packages/ui structure
- Port design tokens to Tamagui config
- Build 5 core primitives (Button, Card, Input, Text, Sheet)
- Configure build tooling

### Phase 2: Web Migration (Week 2)

- Migrate astro.config to Tamagui
- Replace 9 UI primitives
- Update design token imports
- Test SSR rendering

### Phase 3: Native Migration (Weeks 3-4)

- Migrate common UI components first
- Create styled() wrappers for commonStyles patterns
- Gradual component-by-component migration
- Keep NativeWind during transition

### Phase 4: Cleanup (Week 5)

- Remove NativeWind dependency
- Remove legacy style/ token directories
- Update documentation
- Performance testing

---

## Appendix: Detailed File Lists

### Native Files Importing Styles (109 matches)

```
components/profile/* (3 files)
components/rewards/* (2 files)
components/notifications/* (3 files)
components/trips/list/* (5 files)
components/trips/groups/* (25+ files)
components/trips/leaderboard/* (5 files)
components/trips/details/* (6 files)
components/trips/challenges/* (22 files)
components/common/* (12 files)
components/alerts/* (3 files)
components/updates/* (1 file)
components/challenges/* (1 file)
components/camera/* (1 file)
components/judgement/* (7 files)
components/map/* (4 files)
app/auth/* (1 file)
hooks/challenges/* (1 file)
```

### Web Configuration Changes

```
astro.config.mjs: Remove @tailwindcss/vite plugin
package.json: Remove tailwindcss, @tailwindcss/vite
package.json: Add tamagui, @tamagui/core, @tamagui/vite-plugin
tsconfig.json: Add "@mirai-app/ui": ["../../packages/ui/src"]
```

### Native Configuration Changes

```
metro.config.js: Add @tamagui/metro-plugin
babel.config.js: Add tamagui babel preset
package.json: Remove nativewind, tailwindcss, react-native-css-interop
package.json: Add tamagui, @tamagui/core, @tamagui/config, @tamagui/metro-plugin
```
