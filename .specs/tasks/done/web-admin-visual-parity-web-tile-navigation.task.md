---
title: "Web Tile Navigation"
type: task
status: done
created: "2026-03-30"
migrated_from: "openspec/changes/archive/2026-03-30-web-admin-visual-parity/specs/web-tile-navigation/spec.md"
parent_design: ".specs/plans/web-admin-visual-parity.design.md"
---

## ADDED Requirements

### Requirement: Dashboard displays navigation tiles

The admin dashboard SHALL display navigation tiles as the primary way to access admin sections, matching native app's tile-based navigation pattern.

#### Scenario: Dashboard shows all admin section tiles

- **WHEN** user views the admin dashboard
- **THEN** tiles SHALL be displayed for: Users, Groups, Transactions, Challenges, Coins, Notifications, Rewards, Activity

#### Scenario: Tiles are clickable navigation

- **WHEN** user clicks a tile (e.g., "Users")
- **THEN** user SHALL be navigated to that section

### Requirement: Tiles display Ionicons

Each dashboard tile SHALL display an Ionicon matching the native app's icon for that section.

#### Scenario: Users tile shows people icon

- **WHEN** viewing the Users tile
- **THEN** the tile SHALL display `IoPeople` (or equivalent) Ionicon

#### Scenario: Challenges tile shows trophy icon

- **WHEN** viewing the Challenges tile
- **THEN** the tile SHALL display `IoTrophy` Ionicon

#### Scenario: Transactions tile shows cash icon

- **WHEN** viewing the Transactions tile
- **THEN** the tile SHALL display `IoCash` Ionicon

### Requirement: Tiles have per-category accent colors

Tiles SHALL use accent colors matching native app's per-tile color scheme.

#### Scenario: User-related tiles use cyan accent

- **WHEN** viewing Users, Transactions, or Challenges tiles
- **THEN** the tile accent color SHALL be cyan (`#00ced1`)

#### Scenario: Reward-related tiles use magenta accent

- **WHEN** viewing Coins, Notifications, or Rewards tiles
- **THEN** the tile accent color SHALL be magenta (`#E533FF`)

#### Scenario: Group-related tiles use slate accent

- **WHEN** viewing Groups or Activity tiles
- **THEN** the tile accent color SHALL be slate/gray

### Requirement: Sidebar removed from default layout

The web admin SHALL NOT display a persistent sidebar on desktop. Navigation happens via dashboard tiles.

#### Scenario: No sidebar on desktop

- **WHEN** viewing admin on desktop viewport (>1024px)
- **THEN** no fixed sidebar SHALL be visible

#### Scenario: Dashboard is landing page

- **WHEN** user navigates to admin root
- **THEN** dashboard with tiles SHALL be displayed

### Requirement: Mobile bottom navigation

On mobile viewports, a bottom navigation bar SHALL provide quick access to key sections.

#### Scenario: Bottom nav visible on mobile

- **WHEN** viewing admin on mobile viewport (<768px)
- **THEN** a bottom navigation bar SHALL be visible

#### Scenario: Bottom nav has home/back navigation

- **WHEN** user is in a detail section on mobile
- **THEN** bottom nav SHALL include a way to return to dashboard

### Requirement: Detail pages have back navigation

When viewing a detail section (e.g., Users list), users SHALL have clear navigation back to the dashboard.

#### Scenario: Header shows current section

- **WHEN** viewing a detail section
- **THEN** header SHALL display the section name

#### Scenario: Back button returns to dashboard

- **WHEN** user clicks back/home navigation
- **THEN** user SHALL return to the dashboard

### Requirement: Responsive tile grid

Dashboard tiles SHALL be arranged in a responsive grid that adapts to viewport size.

#### Scenario: Mobile shows 2 columns

- **WHEN** viewing dashboard on mobile (<768px)
- **THEN** tiles SHALL display in 2-column grid

#### Scenario: Tablet shows 3-4 columns

- **WHEN** viewing dashboard on tablet (768px-1024px)
- **THEN** tiles SHALL display in 3-4 column grid

#### Scenario: Desktop shows 4 columns

- **WHEN** viewing dashboard on desktop (>1024px)
- **THEN** tiles SHALL display in 4-column grid
