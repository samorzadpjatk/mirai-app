---
title: "Web Dark Theme"
type: task
status: done
created: "2026-03-30"
migrated_from: "openspec/changes/archive/2026-03-30-web-admin-visual-parity/specs/web-dark-theme/spec.md"
parent_design: ".specs/plans/web-admin-visual-parity.design.md"
---

## ADDED Requirements

### Requirement: Web admin uses dark background color

The web admin app SHALL use `#17181c` as the default page background color, matching the native app's dark theme.

#### Scenario: Page background is dark

- **WHEN** user loads any page in the admin web app
- **THEN** the background color SHALL be `#17181c`

### Requirement: Web admin uses dark card colors

Card and surface components SHALL use `#1b2828` background color matching native app's card dark color.

#### Scenario: Dashboard tiles have dark background

- **WHEN** viewing the admin dashboard
- **THEN** each tile card SHALL have background color `#1b2828`

#### Scenario: Content panels have dark background

- **WHEN** viewing detail pages (users list, transactions, etc.)
- **THEN** content panels SHALL have background color `#1b2828`

### Requirement: Web admin uses cyan primary color

The primary action color SHALL be `#00ced1` (cyan) matching native app.

#### Scenario: Primary buttons use cyan

- **WHEN** a primary action button is rendered
- **THEN** the button background SHALL be `#00ced1`

#### Scenario: Primary links use cyan

- **WHEN** a primary text link is rendered
- **THEN** the link color SHALL be `#00ced1`

### Requirement: Web admin uses magenta accent color

The accent/secondary color SHALL be `#E533FF` (magenta) matching native app.

#### Scenario: Accent elements use magenta

- **WHEN** an accent badge or highlight is rendered
- **THEN** the color SHALL be `#E533FF`

### Requirement: Text colors follow dark theme contrast

Text colors SHALL provide sufficient contrast on dark backgrounds, using light text (`#f8fafc` or similar) for body text.

#### Scenario: Body text is readable

- **WHEN** viewing text content on dark background
- **THEN** text color SHALL be light (approximately `#f8fafc` or `#e2e8f0`)

#### Scenario: Muted text is visible

- **WHEN** viewing secondary/muted text
- **THEN** text color SHALL be dimmed but readable (approximately `#94a3b8`)

### Requirement: Tailwind theme configured with design tokens

The `apps/admin-web/src/styles/global.css` SHALL configure Tailwind v4 `@theme` with colors imported from the shared design tokens package.

#### Scenario: Tailwind classes use token colors

- **WHEN** developer uses `bg-background` class
- **THEN** the background SHALL be `#17181c`

#### Scenario: Token updates propagate to web

- **WHEN** a color token is updated in shared package
- **THEN** web app styles SHALL reflect the change after rebuild
