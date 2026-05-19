---
version: alpha
name: MIRAI / PJApp Design System
---

# MIRAI Design System

> **Document purpose:** Platform-agnostic design system for the MIRAI / PJApp monorepo. Defines brand identity, core tokens, and cross-platform patterns. Platform-specific implementations (Native, Web, etc.) are documented in their respective app directories.
> **Format:** Based on [Google Labs DESIGN.md spec](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md).
> **Last updated:** 2025-05-19

---

## 1. Overview

MIRAI (also known as PJApp) is an event management platform for student communities. The visual identity is built on three principles:

1. **Dark-first readability** — Optimized for outdoor/event environments where bright screens matter
2. **Neon accent hierarchy** — A single vibrant accent color creates instant visual focus on actions
3. **Layered depth** — Cards, overlays, and subtle borders create information hierarchy without heavy chrome

| Property | Value |
|---|---|
| **Name** | MIRAI / PJApp |
| **Primary audience** | University students, event participants |
| **Primary platform** | Mobile native (iOS & Android via Expo) |
| **Secondary platforms** | Web (future), Admin dashboards (future) |
| **License** | AGPL-3.0 |

---

## 2. Brand Identity

### 2.1 Name & Logo

- **Primary name:** MIRAI
- **Secondary name:** PJApp (PJAIT Student Government Mobile Application)
- **Logo:** `mirai_logo.png` — located in `apps/native/assets/`
- **Logo usage:** Always maintain aspect ratio; use `contentFit="contain"`; animate entry with `ZoomIn`

### 2.2 Personality

| Trait | Expression |
|---|---|
| **Modern** | Clean lines, generous whitespace, minimal ornamentation |
| **Energetic** | Vibrant cyan accent on dark surfaces creates excitement |
| **Accessible** | High contrast ratios, clear typography hierarchy, readable in sunlight |
| **Community** | User avatars, group cards, social features are visually prominent |

---

## 3. Colors

The palette is intentionally small. Most UI uses shades of dark charcoal and white; color is reserved for meaning and action.

### 3.1 Brand Colors

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#00ced1` | Primary actions, active states, brand identity, links |
| `accent` | `#E533FF` | Secondary highlights, special badges, premium features |

### 3.2 Neutral Scale

| Token | Hex | Usage |
|---|---|---|
| `background` | `#17181c` | Default background (dark mode) |
| `backgroundLight` | `#f1f1f4` | Light mode background (if/when implemented) |
| `surface` | `#1b2828` | Cards, panels, elevated surfaces |
| `surfaceElevated` | `#272935` | Inputs, dropdowns, highest surfaces |

### 3.3 Text Colors

| Token | Hex | Usage |
|---|---|---|
| `text` | `#ffffff` | Primary text on dark backgrounds |
| `textSecondary` | `#9ca3af` | Subtitles, descriptions, hints |
| `textTertiary` | `#64748b` | Metadata, timestamps, disabled hints |
| `textMuted` | `#475569` | Placeholders, empty states |

### 3.4 Semantic Colors

| Token | Hex | Meaning |
|---|---|---|
| `success` | `#22c55e` | Completed, verified, active status |
| `warning` | `#f59e0b` | Pending, voting phase, needs attention |
| `danger` | `#ef4444` | Errors, destructive actions, rejections |
| `info` | `#0ea5e9` | Visible, available, informational status |

### 3.5 Opacity System

All colors can be expressed at varying opacity levels for backgrounds, borders, and overlays. The standard scale is:

| Level | Value | Typical Use |
|---|---|---|
| 4% | `0.04` | Subtle backgrounds |
| 8% | `0.08` | Hover states |
| 10% | `0.10` | Subtle borders, inactive chips |
| 12% | `0.12` | Active backgrounds |
| 20% | `0.20` | Secondary backgrounds, borders |
| 30% | `0.30` | Emphasized borders |
| 40% | `0.40` | Overlays, scrims |
| 50% | `0.50` | Modal backdrops |
| 70% | `0.70` | Glass/card overlays |
| 80% | `0.80` | Strong accents |

> **Platform note:** Native implementation uses `rgba()` strings. Web implementation should use CSS custom properties or Tailwind opacity modifiers.

---

## 4. Typography

### 4.1 Font Philosophy

- **Primary:** IBM Plex Sans — modern, geometric, excellent legibility at small sizes
- **Weights used:** 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- **Display:** Tighter letter-spacing (`-0.5px`) on headings above 24px
- **Body:** Generous line-height (1.5) for readability

### 4.2 Scale

All font sizes are derived from a 14px base:

| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `xs` | 10px | 1.2 | 400 | Badges, timestamps |
| `sm` | 12px | 1.5 | 400 | Secondary text, descriptions |
| `base` | 14px | 1.5 | 400 | Body text, default |
| `lg` | 16px | 1.5 | 500 | Buttons, card titles |
| `xl` | 18px | 1.4 | 600 | Sub-headings |
| `2xl` | 20px | 1.3 | 600 | Emphasized text |
| `3xl` | 24px | 1.3 | 700 | H2 headings |
| `4xl` | 36px | 1.2 | 700 | H1 hero titles |

### 4.3 Special Patterns

- **Labels:** 10px, bold (700), uppercase, `letter-spacing: 2px` — used for section headers and categories
- **Hero titles:** 36px, bold, `letter-spacing: -0.5px` — tight display for impact
- **Counters/Numbers:** Use tabular figures (`font-variant-numeric: tabular-nums`) for alignment
- **Monospace:** IBM Plex Sans includes a monospace variant for code/IDs

---

## 5. Spacing

### 5.1 Base Unit

The base spacing unit is **4px** (0.25rem). All spacing values are multiples of this unit.

| Token | Value | Common Use |
|---|---|---|
| `xs` | 4px | Tight gaps, icon padding |
| `sm` | 8px | Inline spacing, small gaps |
| `md` | 12px | Card internal padding, list gaps |
| `lg` | 16px | Section padding, card padding |
| `xl` | 20px | Large gaps, section separators |
| `2xl` | 24px | Modal padding, form sections |
| `3xl` | 32px | Screen edge padding (compact) |
| `4xl` | 48px | Screen edge padding (comfortable) |

### 5.2 Spacing Principles

1. **Use gap over margin** — Flex `gap` is preferred for component internals
2. **Consistent rhythm** — Maintain 12px or 16px as the standard card/content padding
3. **Density zones** — Dense data (tables, lists) use `sm` (8px); content zones use `lg` (16px)
4. **Touch targets** — Minimum 44×44px for all interactive elements

---

## 6. Shape

### 6.1 Border Radius

| Token | Value | Usage |
|---|---|---|
| `sm` | 8px | Small buttons, tags, inputs |
| `md` | 12px | Cards, standard buttons, modals |
| `lg` | 16px | Large cards, image containers |
| `xl` | 20px | Hero cards, featured content |
| `full` | 9999px | Pills, avatars, circular buttons |

### 6.2 Border Style

- **Standard:** 1px solid with low-opacity color (typically `rgba(255,255,255,0.05)` on dark)
- **Emphasized:** 1px solid with `primary` at 30% opacity
- **Selected:** 1px solid with full `primary` color

---

## 7. Elevation

Elevation creates depth through layered shadows. The system defines 6 levels:

| Level | iOS Shadow | Android Elevation | Usage |
|---|---|---|---|
| 1 | `0 2px 4px rgba(0,0,0,0.1)` | 2 | Subtle cards, inline elements |
| 2 | `0 4px 8px rgba(0,0,0,0.2)` | 4 | Standard cards, buttons |
| 3 | `0 10px 20px rgba(0,0,0,0.3)` | 10 | Modals, floating panels |
| 4 | `0 10px 30px rgba(0,0,0,0.5)` | 20 | Overlays, sheets, dropdowns |
| Glow | `0 0 15px rgba(0,206,209,0.4)` | 8 | Primary buttons (colored shadow) |
| Glow Strong | `0 0 20px rgba(0,206,209,0.3)` | 8 | Emphasized CTAs |

> **Platform note:** iOS uses `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`. Android uses `elevation`. Implementations must provide both.

---

## 8. Component Philosophy

### 8.1 Core Components

The design system is built around a small set of reusable primitives:

| Component | Purpose |
|---|---|
| **Card** | Primary content container. Dark background with subtle border. |
| **Button** | Primary actions use `primary` background with dark text. Secondary actions use outlined style. |
| **List Item** | Avatar + title + subtitle pattern for user-generated content. |
| **Input** | Dark surface background with subtle border. Active state uses `primary` border. |
| **Badge** | Small pill-shaped labels for status and categories. |
| **Avatar** | Circular user/group images with fallback initials. |
| **Empty State** | Centered icon + title + subtitle pattern for zero-content screens. |
| **Hero** | Large banner card with image background and gradient overlay for featured content. |

### 8.2 States

| State | Visual Treatment |
|---|---|
| **Default** | Standard colors and borders |
| **Hover/Pressed** | 80% opacity reduction |
| **Selected** | Primary border + 10% primary background |
| **Disabled** | 50% opacity, no shadow |
| **Loading** | Spinner in place of content, reduced opacity |

### 8.3 Status Indicators

| Status | Color | Icon |
|---|---|---|
| Hidden / Draft | `textTertiary` (#64748b) | Eye-off |
| Visible / Published | `info` (#0ea5e9) | Eye |
| Active / Ongoing | `success` (#22c55e) | Checkmark |
| Voting Phase | `warning` (#f59e0b) | Clock |
| Completed | `success` (#10b981) | Flag |

---

## 9. Layout Principles

### 9.1 Content Structure

```
Screen
├── Safe Area (top/bottom insets)
├── Scrollable Content
│   ├── Hero / Header (optional)
│   ├── Section (gap: lg)
│   │   ├── Label (uppercase, xs)
│   │   └── Card(s) (gap: md)
│   └── Section
└── Tab Bar / Navigation (if applicable)
```

### 9.2 Responsive Behavior

- **Mobile (< 768px):** Single column, full-width cards, 16px screen margins
- **Tablet (768–1024px):** 2-column grids for cards, 24px margins
- **Desktop (> 1024px):** Max-width container (768px centered), generous whitespace

### 9.3 Navigation Patterns

- **Mobile:** Bottom tab bar with 4–5 items; stack navigation for detail screens
- **Desktop:** Side navigation rail or top header with dropdown menus
- **Web:** URL-based routing with breadcrumb trail

---

## 10. Platform Adaptations

### 10.1 Native Mobile (iOS & Android)

- **Implementation:** See `apps/native/DESIGN.md`
- **Framework:** Expo React Native with NativeWind
- **Special notes:**
  - Use platform-specific shadows (iOS `shadow-*` + Android `elevation`)
  - Support SF Symbols on iOS via `expo-image`
  - Use `contentInsetAdjustmentBehavior="automatic"` for safe areas
  - Enable haptics on iOS for interactive elements
  - Minimum touch target: 44×44px

### 10.2 Web (Future)

- **Framework:** TBD (recommended: Next.js or Remix)
- **Implementation:** Should use CSS custom properties mapped to the token system
- **Special notes:**
  - Use `rem` units for accessibility scaling
  - Support `prefers-color-scheme` for dark/light mode
  - Use CSS `box-shadow` (not `elevation`)

### 10.3 API / Backend

- **Framework:** Hono + oRPC (`apps/backend-server`)
- **Design role:** No visual UI; design system ensures API responses contain semantic status colors and user avatar URLs consistent with the native app

---

## 11. Accessibility

### 11.1 Contrast Requirements

| Element | Minimum Ratio |
|---|---|
| Body text | 4.5:1 (WCAG AA) |
| Large text (18px+ bold) | 3:1 (WCAG AA) |
| UI components (buttons, icons) | 3:1 |

Current ratios:
- `textPrimary` (#ffffff) on `background` (#17181c): **15.8:1** ✅
- `textSecondary` (#9ca3af) on `background`: **7.1:1** ✅
- `primary` (#00ced1) on `background`: **9.2:1** ✅
- `primary` (#00ced1) with dark text (#17181c): **9.2:1** ✅

### 11.2 Touch Targets

- Minimum: 44×44px for all interactive elements
- Preferred: 48×48px for primary actions

### 11.3 Motion

- Respect `prefers-reduced-motion` where applicable
- Animations should be subtle (200–300ms) and purposeful
- Loading states should always have visual feedback

---

## 12. File Structure

```
DESIGN.md              # This file — platform-agnostic design system
apps/
  native/
    DESIGN.md          # Native platform implementation guide
    src/styles/        # Native token implementation (TypeScript)
    tailwind.config.cjs # NativeWind configuration
packages/
  shared/
    src/design-tokens/ # Future: shared platform-agnostic tokens
```

---

## 13. References

| Resource | URL |
|---|---|
| Google Labs DESIGN.md Spec | https://github.com/google-labs-code/design.md |
| W3C Design Tokens Format | https://www.designtokens.org |
| IBM Plex Sans | https://fonts.google.com/specimen/IBM+Plex+Sans |
| WCAG Contrast Guidelines | https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum |

---

*Maintainers: MIRAI Frontend Team*
*License: AGPL-3.0*
