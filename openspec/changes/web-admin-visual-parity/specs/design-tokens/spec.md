## ADDED Requirements

### Requirement: Design tokens package exports color tokens

The `packages/shared/design-tokens/` package SHALL export a `colors` constant containing all color values used in the design system, including primary, accent, background, surface, text, border, and tile accent colors.

#### Scenario: Import colors in web app

- **WHEN** developer imports `import { colors } from '@pjapp/shared/design-tokens'`
- **THEN** they receive a typed object with all color tokens

#### Scenario: Color tokens match native app values

- **WHEN** comparing `colors.primary` to native app's `colors.ts`
- **THEN** the value SHALL be `#00ced1`

#### Scenario: Tile accent colors available

- **WHEN** accessing `colors.tile.users`
- **THEN** the value SHALL match native's cyan accent for user-related tiles

### Requirement: Design tokens package exports spacing tokens

The package SHALL export a `spacing` constant with the spacing scale (xs, sm, md, lg, xl, xxl, xxxl) matching native app values.

#### Scenario: Import spacing in web app

- **WHEN** developer imports `import { spacing } from '@pjapp/shared/design-tokens'`
- **THEN** they receive a typed object with spacing values in pixels

#### Scenario: Spacing values match native

- **WHEN** comparing `spacing.md` to native app's `spacing.ts`
- **THEN** the value SHALL be `12`

### Requirement: Design tokens package exports typography tokens

The package SHALL export a `typography` constant with font families, sizes, and weights matching native app values.

#### Scenario: Import typography in web app

- **WHEN** developer imports `import { typography } from '@pjapp/shared/design-tokens'`
- **THEN** they receive a typed object with font family and size scale

#### Scenario: Display font specified

- **WHEN** accessing `typography.fontFamily.display`
- **THEN** the value SHALL include "Space Grotesk" as primary font

### Requirement: Design tokens package exports border radius tokens

The package SHALL export a `borderRadius` constant with radius values for consistent corner rounding.

#### Scenario: Import border radius

- **WHEN** developer imports `import { borderRadius } from '@pjapp/shared/design-tokens'`
- **THEN** they receive radius values matching native app's `spacing.borderRadius`

### Requirement: Design tokens has barrel export

The package SHALL provide a barrel export at `packages/shared/design-tokens/index.ts` that re-exports all token categories.

#### Scenario: Single import for all tokens

- **WHEN** developer imports `import * as tokens from '@pjapp/shared/design-tokens'`
- **THEN** they can access `tokens.colors`, `tokens.spacing`, `tokens.typography`, `tokens.borderRadius`
