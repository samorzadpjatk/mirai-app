---
title: "Global Providers Island"
type: task
status: done
created: "2026-03-30"
migrated_from: "openspec/changes/archive/2026-03-30-optimize-admin-web-with-islands-architecture/specs/global-providers-island/spec.md"
parent_design: ".specs/plans/optimize-admin-web-with-islands-architecture.design.md"
---

## ADDED Requirements

### Requirement: GlobalProviders component wraps essential context

The system SHALL provide a `GlobalProviders` React component that wraps AuthProvider, APIProvider, TripProvider, and includes Header and navigation components, suitable for hydration as an Astro island.

#### Scenario: Component includes all required providers

- **WHEN** `GlobalProviders` is rendered
- **THEN** it wraps children in AuthProvider, APIProvider from `@mirai-app/trpc/client`, and TripProvider
- **THEN** providers are nested in correct order (AuthProvider outermost, then APIProvider, then TripProvider)

#### Scenario: Component includes navigation

- **WHEN** `GlobalProviders` is rendered
- **THEN** it renders Header component
- **THEN** it renders MobileNav component
- **THEN** it renders TripSelector component

### Requirement: GlobalProviders is used on every admin page

The system SHALL load GlobalProviders as a client-side island (`client:load`) on every admin page via AdminLayout.

#### Scenario: AdminLayout includes GlobalProviders

- **WHEN** any admin page renders using AdminLayout
- **THEN** AdminLayout includes `<GlobalProviders client:load>`
- **THEN** GlobalProviders hydrates immediately on page load

### Requirement: GlobalProviders maintains state across navigation

The system SHALL preserve GlobalProviders state (auth, tRPC client, selected trip) when navigating between admin pages using view transitions.

#### Scenario: Auth state persists on navigation

- **WHEN** user navigates from /users to /groups
- **THEN** auth state (access token, user session) is NOT reset
- **THEN** user remains authenticated

#### Scenario: Trip selection persists on navigation

- **WHEN** user has selected a trip and navigates to different page
- **THEN** selected trip remains active
- **THEN** TripSelector shows same selected trip

### Requirement: GlobalProviders bundles to acceptable size

The GlobalProviders island SHALL bundle to approximately 100KB or less including all providers, Supabase client, tRPC client, and navigation components.

#### Scenario: Bundle size is within budget

- **WHEN** admin-web is built for production
- **THEN** GlobalProviders island bundle is ≤ 100KB (gzipped acceptable)
- **THEN** bundle includes AuthProvider, APIProvider, TripProvider, Header, MobileNav, TripSelector

### Requirement: TripProvider fetches and manages trip selection

The TripProvider within GlobalProviders SHALL fetch all trips, manage selected trip state, and persist selection to localStorage.

#### Scenario: Trips are fetched on mount

- **WHEN** GlobalProviders mounts
- **THEN** TripProvider fetches all trips via `useAdminTrips()` hook
- **THEN** loading state is available to consuming components

#### Scenario: Trip selection is persisted

- **WHEN** user selects a trip via TripSelector
- **THEN** selection is saved to localStorage with key `ACTIVE_TRIP_STORAGE_KEY`
- **WHEN** user refreshes page
- **THEN** previously selected trip is restored from localStorage

#### Scenario: First trip is auto-selected

- **WHEN** no trip is selected and trips are loaded
- **THEN** first trip in list is automatically selected
- **THEN** selected trip is available via `useTrip()` hook

### Requirement: Header and navigation are interactive

The Header and navigation components within GlobalProviders SHALL be fully interactive client-side, supporting logout, mobile menu toggling, and trip selection.

#### Scenario: Logout button works

- **WHEN** user clicks logout button in Header
- **THEN** AuthProvider clears session
- **THEN** user is redirected to login page

#### Scenario: Mobile navigation toggles

- **WHEN** user clicks mobile menu button on small screen
- **THEN** MobileNav opens/closes
- **THEN** navigation links are accessible

#### Scenario: Trip selector changes active trip

- **WHEN** user selects different trip from TripSelector
- **THEN** `setSelectedTrip()` updates context
- **THEN** all components using `useTrip()` receive new trip
- **THEN** page data refetches for new trip

### Requirement: GlobalProviders uses transition:persist directive

The system SHALL use Astro's `transition:persist` directive on GlobalProviders to prevent unmounting during page transitions.

#### Scenario: GlobalProviders persists across navigation

- **WHEN** view transitions are enabled
- **THEN** GlobalProviders has `transition:persist` attribute
- **THEN** providers do NOT remount when navigating between pages
- **THEN** ongoing tRPC requests are NOT cancelled

### Requirement: APIProvider configuration matches native app

The APIProvider in GlobalProviders SHALL use same configuration as native app: httpBatchLink with superjson transformer and auth headers.

#### Scenario: tRPC client uses batch link

- **WHEN** multiple tRPC queries execute simultaneously
- **THEN** they are batched into single HTTP request
- **THEN** requests use superjson for serialization

#### Scenario: Auth headers are included

- **WHEN** tRPC request is made
- **THEN** Authorization header includes Bearer token from authStore
- **THEN** requests are authenticated with current user session
