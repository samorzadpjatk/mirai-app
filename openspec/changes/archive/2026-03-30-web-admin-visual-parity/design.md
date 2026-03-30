## Context

The React Native admin panel establishes a mature dark-theme design system with:

- Colors in `apps/native/src/styles/colors.ts` (primary `#00ced1`, accent `#E533FF`, background `#17181c`)
- Spacing in `apps/native/src/styles/spacing.ts` (xs/sm/md/lg/xl/xxl/xxxl scale)
- Typography in `apps/native/src/styles/typography.ts` (Space Grotesk display font)
- Ionicons via `@expo/vector-icons`

The Astro web admin panel currently uses:

- Light theme with blue primary (`#3b82f6`), white backgrounds
- Desktop-first sidebar layout (`w-64` fixed)
- Tailwind v4 with `@theme` directive in `global.css`
- Emoji icons instead of Ionicons

Both apps are in the same monorepo with `packages/shared/` available for shared code.

## Goals / Non-Goals

**Goals:**

- Visual parity: web admin looks and feels like native admin
- Shared design tokens that both platforms can import
- Mobile-first responsive layout on web
- Dark mode as default (matching native)

**Non-Goals:**

- Light mode toggle for web (future enhancement)
- Refactoring native app to consume shared tokens (optional, low priority)
- Changing native app's visual design
- Feature parity (only visual alignment)

## Decisions

### D1: Design tokens package location

**Decision**: Create `packages/shared/design-tokens/` with TypeScript exports

**Alternatives considered:**

- CSS custom properties file: Wouldn't work for React Native
- Tailwind preset: Native can't consume Tailwind configs
- Separate `packages/design-tokens`: Overkill for internal use

**Rationale**: TypeScript constants work in both environments. Keeping in `shared` avoids package proliferation.

### D2: Icon library for web

**Decision**: Use `react-icons/io5` (Ionicons 5)

**Alternatives considered:**

- `@iconify/react`: Larger bundle, more complex
- SVG sprites: Manual maintenance burden
- Keep emojis: Poor visual parity

**Rationale**: `react-icons` provides Ionicons that match native's `@expo/vector-icons` Ionicons exactly. Tree-shakeable, well-maintained.

### D3: Layout approach for web

**Decision**: Replace sidebar with bottom navigation on mobile, tile dashboard on all sizes

**Alternatives considered:**

- Keep sidebar, just restyle: Doesn't match native UX
- Hamburger menu: Extra tap to navigate, worse UX
- Tabs at top: Doesn't match native bottom-tabs pattern

**Rationale**: Native uses tiles as primary navigation from dashboard. Web should mirror this. Bottom nav on mobile matches native tab bar position.

### D4: Tailwind dark mode implementation

**Decision**: Set dark colors as default in `@theme`, no mode toggle

**Alternatives considered:**

- `darkMode: 'class'` with toggle: Adds complexity, not needed yet
- CSS `prefers-color-scheme`: User might prefer light but we want dark

**Rationale**: Native is dark-only currently. Match that. Light mode can be added later.

### D5: Token format

**Decision**: TypeScript constants with a Tailwind plugin to inject into `@theme`

```typescript
// packages/shared/design-tokens/colors.ts
export const colors = {
  primary: "#00ced1",
  accent: "#E533FF",
  background: { dark: "#17181c", card: "#1b2828" },
  // ...
} as const;
```

```typescript
// apps/admin-web/tailwind.config.ts
import { colors } from "@pjapp/shared/design-tokens";
// Use in @theme or extend
```

**Rationale**: TypeScript gives type safety. Direct import in Tailwind config avoids build complexity.

## Risks / Trade-offs

| Risk                                             | Mitigation                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------ |
| Bundle size increase from react-icons            | Tree-shaking keeps only used icons; monitor with bundle analyzer   |
| Native app breaking if shared tokens change      | Native continues using its own files initially; migration optional |
| Sidebar removal disrupts existing users          | No users yet (admin is internal); acceptable                       |
| Mobile bottom nav conflicts with device gestures | Use safe-area-inset padding; test on actual devices                |

## Migration Plan

1. **Phase 1**: Create `packages/shared/design-tokens/` with colors, spacing, typography exports
2. **Phase 2**: Update `apps/admin-web/src/styles/global.css` to use dark theme colors
3. **Phase 3**: Replace sidebar with tile navigation, add mobile bottom nav
4. **Phase 4**: Replace emoji icons with Ionicons
5. **Phase 5**: Add per-tile accent colors matching native

No database migrations. No API changes. Purely frontend.

**Rollback**: Git revert; changes are isolated to admin-web styling.
