---
title: "View Transitions"
type: task
status: done
created: "2026-03-30"
migrated_from: "openspec/changes/archive/2026-03-30-optimize-admin-web-with-islands-architecture/specs/view-transitions/spec.md"
parent_design: ".specs/plans/optimize-admin-web-with-islands-architecture.design.md"
---

## ADDED Requirements

### Requirement: View transitions are enabled

The system SHALL use Astro's view transitions for smooth SPA-like navigation between admin pages.

#### Scenario: ViewTransitions component is added

- **WHEN** Layout.astro renders
- **THEN** it imports ClientRouter from `astro:transitions`
- **THEN** ClientRouter component is included in `<head>` section

#### Scenario: Navigation uses view transitions

- **WHEN** user clicks link from /users to /groups
- **THEN** page transition is animated smoothly
- **THEN** new page content fades in
- **THEN** transition feels like SPA navigation, not full page reload

### Requirement: GlobalProviders persists across transitions

The GlobalProviders island SHALL persist across page transitions to maintain auth state, tRPC context, and selected trip.

#### Scenario: GlobalProviders has transition:persist

- **WHEN** GlobalProviders island is rendered in AdminLayout
- **THEN** it includes `transition:persist` directive
- **THEN** component is NOT unmounted during page transitions

#### Scenario: Auth state persists

- **WHEN** user navigates between pages
- **THEN** auth session is NOT reset
- **THEN** user remains logged in
- **THEN** no re-authentication occurs

#### Scenario: Selected trip persists

- **WHEN** user has selected a trip and navigates to different page
- **THEN** selected trip remains in context
- **THEN** TripSelector shows same selection
- **THEN** new page receives same tripId from context

### Requirement: In-flight tRPC requests are preserved

When navigating between pages, in-flight tRPC requests SHALL NOT be cancelled if they're part of persisted providers.

#### Scenario: Global queries continue across navigation

- **WHEN** trips are being fetched and user navigates
- **THEN** trip fetch request is NOT cancelled
- **THEN** data becomes available on new page

### Requirement: Page-specific content transitions smoothly

Page-specific island components (UsersPageContent, GroupsPageContent, etc.) SHALL transition smoothly when navigation occurs.

#### Scenario: Page content fades between routes

- **WHEN** user navigates from /users to /groups
- **THEN** UsersPageContent fades out
- **THEN** GroupsPageContent fades in
- **THEN** transition is smooth and not jarring

### Requirement: Browser back/forward buttons work

View transitions SHALL work with browser back and forward navigation, providing smooth transitions in both directions.

#### Scenario: Back button uses transitions

- **WHEN** user navigates to /groups then clicks browser back
- **THEN** page transitions back to /users smoothly
- **THEN** UsersPageContent is restored (or refetched if needed)

#### Scenario: Forward button uses transitions

- **WHEN** user navigates back then clicks forward
- **THEN** page transitions forward smoothly
- **THEN** view transition animation plays

### Requirement: Transition animations are fast

View transition animations SHALL be quick (under 200ms) to maintain perception of speed.

#### Scenario: Transition completes quickly

- **WHEN** user clicks navigation link
- **THEN** transition animation completes in < 200ms
- **THEN** new page is interactive quickly

### Requirement: Fallback works without JavaScript

If JavaScript fails or is disabled, the system SHALL fall back to standard navigation without breaking functionality.

#### Scenario: Progressive enhancement

- **WHEN** JavaScript is disabled
- **THEN** navigation links still work via standard href
- **THEN** pages load via full page navigation
- **THEN** no errors occur

### Requirement: View transitions are configurable per-page

Individual pages MAY opt out of view transitions if needed for specific UX requirements.

#### Scenario: Page can disable transitions

- **WHEN** specific page needs instant navigation (e.g., for UX reasons)
- **THEN** page can set `transition:animate="none"` on elements
- **THEN** that page transitions instantly instead of animating
