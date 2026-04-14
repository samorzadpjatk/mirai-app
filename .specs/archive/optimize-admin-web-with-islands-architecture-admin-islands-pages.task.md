---
title: "Admin Islands Pages"
type: task
status: done
created: "2026-03-30"
migrated_from: "openspec/changes/archive/2026-03-30-optimize-admin-web-with-islands-architecture/specs/admin-islands-pages/spec.md"
parent_design: ".specs/plans/optimize-admin-web-with-islands-architecture.design.md"
---

## ADDED Requirements

### Requirement: All admin pages use Astro file-based routing

The system SHALL use Astro's file-based routing for all admin pages, eliminating manual client-side path matching in AdminApp.tsx.

#### Scenario: Users pages use file-based routing

- **WHEN** user navigates to /users
- **THEN** Astro renders `pages/users/index.astro`
- **WHEN** user navigates to /users/new
- **THEN** Astro renders `pages/users/new.astro`
- **WHEN** user navigates to /users/123/edit
- **THEN** Astro renders `pages/users/[userId]/edit.astro` with userId param

#### Scenario: All admin sections have file-based routes

- **WHEN** admin pages exist for: dashboard, users, groups, challenges, rewards, activity, notifications, transactions, coins, schedules
- **THEN** each has corresponding Astro files in `pages/` directory
- **THEN** no manual path matching exists in client-side code

### Requirement: Each page renders page-specific island component

Each Astro admin page SHALL render a page-specific island component (e.g., `UsersPageContent`) with `client:load` directive for immediate hydration.

#### Scenario: Users page renders UsersPageContent island

- **WHEN** `pages/users/index.astro` renders
- **THEN** it includes `<UsersPageContent client:load />`
- **THEN** UsersPageContent hydrates on page load
- **THEN** component has access to GlobalProviders context (auth, tRPC, trip)

#### Scenario: Each page has dedicated island component

- **WHEN** any admin page renders (dashboard, users, groups, etc.)
- **THEN** it renders dedicated island component (DashboardContent, UsersPageContent, GroupsPageContent, etc.)
- **THEN** island component is located in `components/admin/<section>/`

### Requirement: Page islands fetch data client-side

Page island components SHALL fetch data client-side using hooks from `@mirai-app/admin-hooks`, maintaining current data fetching patterns.

#### Scenario: UsersPageContent fetches users client-side

- **WHEN** UsersPageContent island mounts
- **THEN** it calls `useAdminUsers(tripId, searchTerm, field)` hook
- **THEN** hook fetches data via tRPC from APIProvider context
- **THEN** loading state is shown while fetching
- **THEN** data is rendered when available

#### Scenario: Data fetching uses selected trip from context

- **WHEN** page island needs trip-specific data
- **THEN** it calls `useTrip()` to get selected trip from context
- **THEN** it passes `tripId` to data fetching hooks

### Requirement: Page bundles are code-split automatically

The system SHALL automatically code-split each page's JavaScript bundle, loading only the code needed for the current page plus GlobalProviders.

#### Scenario: Users page loads only users code

- **WHEN** /users page is loaded
- **THEN** browser downloads GlobalProviders bundle (~100KB)
- **THEN** browser downloads UsersPageContent bundle (estimated ~50-80KB)
- **THEN** browser does NOT download GroupsPageContent, ChallengesPageContent, or other page bundles

#### Scenario: Each page has separate bundle

- **WHEN** admin-web is built for production
- **THEN** each page-specific component creates separate bundle file
- **THEN** bundle filenames include page identifier (e.g., UsersPageContent.<hash>.js)

### Requirement: Page islands maintain existing functionality

Each migrated page island SHALL maintain 100% feature parity with original AdminApp page implementation.

#### Scenario: Users page functionality preserved

- **WHEN** UsersPageContent renders
- **THEN** it shows user list with search and filters (same as before)
- **THEN** it supports infinite scroll pagination (same as before)
- **THEN** clicking "New User" navigates to /users/new (same as before)
- **THEN** clicking user edit button navigates to /users/[userId]/edit (same as before)

#### Scenario: Challenges page sub-routes work

- **WHEN** user navigates to /challenges/123/voting
- **THEN** voting page renders with same functionality as before
- **WHEN** user navigates to /challenges/123/judging
- **THEN** judging page renders with same functionality as before
- **WHEN** user navigates to /challenges/123/submissions
- **THEN** submissions page renders with same functionality as before

### Requirement: Dynamic routes use Astro params

Pages with dynamic segments (IDs) SHALL use Astro's dynamic route parameters accessed via `Astro.params`.

#### Scenario: Edit user page receives userId param

- **WHEN** `pages/users/[userId]/edit.astro` renders for /users/123/edit
- **THEN** Astro.params.userId equals "123"
- **THEN** userId is passed to EditUserForm island component
- **THEN** island component uses userId to fetch user data

#### Scenario: Challenge detail pages receive challengeId param

- **WHEN** `/challenges/[id]/voting.astro` renders for /challenges/abc/voting
- **THEN** Astro.params.id equals "abc"
- **THEN** challengeId is passed to StaffVotingPage island component

### Requirement: Pages use AdminLayout for consistent structure

All admin pages SHALL use AdminLayout which includes GlobalProviders island and consistent page structure.

#### Scenario: Page uses AdminLayout

- **WHEN** any admin page renders
- **THEN** it imports and uses AdminLayout component
- **THEN** AdminLayout includes GlobalProviders with navigation
- **THEN** page content is rendered in AdminLayout's slot

### Requirement: Dashboard page exists at root

The admin dashboard SHALL be accessible at `/` (root path) rendering the dashboard page.

#### Scenario: Root path shows dashboard

- **WHEN** user navigates to `/` (root of admin-web)
- **THEN** `pages/index.astro` renders
- **THEN** Dashboard island component is rendered
- **THEN** dashboard shows overview/stats

### Requirement: Form pages handle submissions without full page reload

Form pages (create, edit) SHALL handle form submissions client-side using mutations from admin hooks, without triggering full page reload.

#### Scenario: Create user form submits client-side

- **WHEN** user fills out new user form and clicks submit
- **THEN** `createUser()` mutation from `useAdminUsers()` is called
- **THEN** page does NOT reload
- **THEN** on success, user is redirected to /users using client-side navigation
- **THEN** user list invalidates and refetches

#### Scenario: Edit user form submits client-side

- **WHEN** user updates existing user and clicks save
- **THEN** `updateName()`, `updateWristNumber()`, etc. mutations are called
- **THEN** page does NOT reload
- **THEN** on success, user is redirected to /users

### Requirement: Page components are located in admin folder

All page-specific island components SHALL be located in `components/admin/<section>/` matching their corresponding page routes.

#### Scenario: Users components in admin/users folder

- **WHEN** users page island component exists
- **THEN** it is located at `components/admin/users/UsersPageContent.tsx`
- **THEN** supporting components (UserCard, UserFilters) are in same folder

#### Scenario: Component naming follows pattern

- **WHEN** page-specific island component is created
- **THEN** it follows naming pattern: `<Section>PageContent.tsx` or `<Section>Page.tsx`
- **THEN** component name clearly indicates it's for a specific page

### Requirement: AdminApp.tsx and manual routing are deleted

The system SHALL NOT include AdminApp.tsx or any manual client-side routing logic after migration is complete.

#### Scenario: AdminApp.tsx does not exist

- **WHEN** migration is complete
- **THEN** `components/AdminApp.tsx` file is deleted
- **THEN** no manual path matching logic exists (`if (currentPath === '/users')` removed)
- **THEN** no components import AdminApp

#### Scenario: Routing is fully file-based

- **WHEN** new admin page needs to be added
- **THEN** developer creates Astro file in `pages/` directory
- **THEN** developer does NOT modify any routing configuration
- **THEN** route is automatically available
