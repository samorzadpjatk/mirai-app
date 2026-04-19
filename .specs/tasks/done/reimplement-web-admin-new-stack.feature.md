---
title: Reimplement web admin app with new tech stack
depends_on: []
status: planned
issue_type: feature
complexity: XL
---

## Architecture Overview

### Solution Strategy

This migration adopts a **layered architecture** following the project's CEK Five Pillars (Domain/UseCase/Adapter/Framework) while replacing legacy technologies with modern, type-safe alternatives:

**Technology Migration Matrix:**
| Legacy | Replacement | Rationale |
|--------|-------------|-----------|
| tRPC + tanstack-query | GraphQL/urql hooks | Auto-generated type-safe hooks, built-in subscriptions, unified with mobile |
| Supabase Auth | Better Auth (Email OTP) | Admin-specific OTP flow, cleaner API, Effect-native patterns |
| Tailwind CSS | Tamagui UI | Cross-platform component sharing with mobile app, design tokens |
| Custom auth logic | Better Auth client | Centralized session management, middleware integration |
| Regular file upload | SeaweedFS Filer native | Resumable uploads for mobile admins, network resilience | // No tusd - using SeaweedFS Filer native TUS support

**Implementation Approach**: Big-bang migration with P0-P4 priority phases. Auth is cross-cutting (all routes depend on it), so we cannot deploy incrementally.

### Architecture Diagrams

#### System Context
```
┌─────────────────────────────────────────────────────────────┐
│                        Admin User                            │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS/WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Astro SSR + React                         │
│  ┌─────────────┐ ┌─────────────┐ ┌───────────────────────┐ │
│  │  middleware │ │   Login     │ │    Feature Pages      │ │
│  │  (auth)     │ │   (OTP)     │ │  (CRUD + real-time)   │ │
│  └─────────────┘ └─────────────┘ └───────────────────────┘ │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐│
│  │  Trip Context (localStorage) + Tamagui UI Components   ││
│  └───────────────────────────────────────────────────────┘│
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Better Auth  │  │   GraphQL    │  │   SeaweedFS  │
│  (/api/auth) │  │  (/graphql)  │  │ (/uploads)   │
└──────────────┘  └──────────────┘  └──────────────┘
```

#### Component Hierarchy
```
Layout.astro (TamaguiProvider)
├── TripContext.Provider
│   └── AdminLayout.astro
│       ├── Header (trip selector)
│       ├── Sidebar (navigation)
│       ├── MobileNav (responsive)
│       └── Main Content
│           ├── Dashboard
│           ├── UsersPage
│           │   ├── UsersPageContent
│           │   ├── UserCard
│           │   └── Create/Edit forms
│           ├── GroupsPage (same pattern)
│           ├── RewardsPage + FileUpload
│           └── ChallengesPage (complex judging)
└── GraphQLProvider (urql client)
    ├── authExchange (token attach)
    ├── cacheExchange (normalized cache)
    └── subscriptionExchange (WebSocket)
```

#### Data Flow: User CRUD
```
1. Route: /users
   └── middleware.ts validates session
       └── redirect /login if missing
       └── 403 if role !== ADMIN

2. Page: UsersPage.tsx
   └── useGetUsersQuery({ tripId })
       └── urql client attaches Bearer token
           └── GraphQL resolver
               └── Database (filtered by trip)
                   └── Response: edges/nodes
                       └── useAdminList hook
                           └── UsersPageContent renders cards

3. Action: Create User
   └── CreateUserForm.tsx
       └── useCreateUserMutation()
           └── POST /graphql
               └── useQuery refetch (cache update)
                   └── Users list updates
```

### Key Decisions

**1. urql over Apollo Client**
- Smaller bundle size (7KB vs 32KB)
- Better cache control with graphcache
- Native subscription support
- Aligns with Effect team's preferences

**2. Better Auth with Email OTP**
- Admin users need passwordless access
- Flow: email → OTP email → OTP verify → session
- Session cookie persists across navigation
- Middleware validates on each route

**3. Effect DI for Complex Operations Only**
- Simple CRUD: urql hooks handle efficiently
- Complex flows (judging, coin ops): Effect.gen
- Keeps cognitive load manageable for team

**4. Trip Context Pattern**
- Multi-tenant admin: all data scoped to selected trip
- localStorage persistence survives refresh
- Stored in React Context for reactivity

**5. File Upload with SeaweedFS Filer**

- Resumable uploads critical for mobile
- SeaweedFS Filer native TUS support
- Direct upload to SeaweedFS with resume capability
- No separate tusd server needed

### Trade-offs

| Decision | Alternatives Considered | Trade-off |
|----------|-------------------------|-----------|
| Big-bang migration | Incremental page-by-page | Rejected: Auth system is cross-cutting, can't mix tRPC and GraphQL flows |
| Tamagui over Tailwind | Keep Tailwind + styled-components | Accepted: Full migration creates mobile parity, avoids permanent tech debt |
| Effect for complex only | Effect for all operations | Accepted: urql handles CRUD well, Effect adds orchestration where needed |
| localStorage for trip | Server-side session state | Accepted: Simpler, survives refresh, no server round-trip |
| GraphQL for everything | tRPC for queries, GraphQL for subs | Rejected: Two data layers add complexity, GraphQL covers all cases |

### Expected Changes

**Phase 1: Foundation (12 files)**
```
apps/web/src/
├── middleware.ts                    # Better Auth middleware (NEW)
├── lib/
│   ├── env.ts                       # Environment config (NEW)
│   ├── auth.ts                      # Auth utilities (NEW)
│   └── graphql-client.ts            # urql client setup (NEW)
├── layouts/
│   ├── Layout.astro                 # TamaguiProvider wrapper (NEW)
│   └── AdminLayout.astro            # Admin shell (NEW)
├── pages/
│   ├── index.astro                  # Dashboard route (NEW)
│   └── login.astro                  # Login route (NEW)
└── components/providers/
    ├── GlobalProviders.tsx          # App providers wrapper (NEW)
    └── GraphQLProvider.tsx          # urql root provider (NEW)
```

**Phase 2: UI Primitives (11 files)**
```
apps/web/src/components/
├── ui/                              # Reusable UI primitives
│   ├── Button.tsx                   # Wrap @mirai-app/ui Button (NEW)
│   ├── Card.tsx                     # Wrap @mirai-app/ui Card (NEW)
│   ├── Input.tsx                    # Wrap @mirai-app/ui Input (NEW)
│   ├── Select.tsx                   # Wrap @mirai-app/ui Select (NEW)
│   ├── Sheet.tsx                    # Modal wrapper (NEW)
│   ├── Text.tsx                     # Typography wrapper (NEW)
│   ├── LoadingSpinner.tsx           # Loading indicator (NEW)
│   └── ErrorMessage.tsx             # Error display (NEW)
├── LoginForm.tsx                    # Better Auth login form (NEW)
├── LoginApp.tsx                     # Login page app (NEW)
└── LogoutButton.tsx                 # Logout action (NEW)
```

**Phase 3: Shell UI (8 files)**
```
apps/web/src/components/
├── Sidebar.tsx                      # Admin navigation (NEW)
├── Header.tsx                       # Top bar with trip selector (NEW)
├── MobileNav.tsx                    # Mobile navigation (NEW)
├── TripSelector.tsx                 # Trip context switcher (NEW)
├── admin/
│   ├── Dashboard.tsx                # Main dashboard (NEW)
│   ├── AdminTile.tsx                # Dashboard tile component (NEW)
│   └── AdminStats.tsx               # Stats display (NEW)
└── contexts/
    └── TripContext.tsx              # Trip selection state (NEW)
```

**Phase 4: Feature Modules (24 files)**
```
apps/web/src/components/admin/
├── users/
│   ├── UsersPage.tsx                # Users list page (NEW)
│   ├── UsersPageContent.tsx         # Users content component (NEW)
│   ├── UserCard.tsx                 # User card component (NEW)
│   ├── CreateUserForm.tsx           # Create user form (NEW)
│   ├── EditUserForm.tsx             # Edit user form (NEW)
│   ├── CreateUserContent.tsx        # Create page wrapper (NEW)
│   └── EditUserContent.tsx          # Edit page wrapper (NEW)
├── groups/
│   ├── GroupsPage.tsx               # Groups list (NEW)
│   ├── GroupsPageContent.tsx        # Groups content (NEW)
│   ├── GroupCard.tsx                # Group card (NEW)
│   ├── CreateGroupForm.tsx          # Create group (NEW)
│   └── EditGroupForm.tsx            # Edit group (NEW)
├── coins/
│   ├── CoinsOverviewPage.tsx        # Coins dashboard (NEW)
│   ├── CoinsPageContent.tsx         # Coins content (NEW)
│   └── CoinOperationForm.tsx        # Add/remove coins (NEW)
└── notifications/
    ├── NotificationsPage.tsx          # Notifications list (NEW)
    ├── NotificationsPageContent.tsx   # Content (NEW)
    ├── NotificationCard.tsx           # Notification item (NEW)
    └── CreateNotificationForm.tsx     # Create notification (NEW)
# Additional: rewards/, challenges/, schedules/, activity/ (similar patterns)
```

**Phase 5: Shared Components (8 files)**
```
apps/web/src/
├── hooks/
│   ├── useAdminList.ts              # Generic list hook (NEW)
│   ├── useFileUpload.ts             # SeaweedFS upload hook (NEW) // No tusd
│   ├── useTripContext.ts            # Trip selection hook (NEW)
│   └── admin/
│       ├── useChallengeForm.ts        # Challenge form logic (NEW)
│       └── useJudgement.ts            # Judging orchestration (NEW)
├── components/
│   └── FileUpload.tsx               # Upload component with progress (NEW)
└── lib/
    └── validators.ts                # Zod schemas (NEW)
```

**Files to Modify (4 files)**
```
apps/web/
├── astro.config.mjs                 # Add routing, optimizeDeps (MODIFY)
├── middleware.ts                    # Rewrite auth middleware (MODIFY)
├── package.json                     # Add react-hook-form, date-fns (MODIFY)
└── tsconfig.json                    # Update paths if needed (MODIFY)
```

**Contracts Defined (5 interfaces)**

| Contract | Location | Purpose |
|----------|----------|---------|
| `IAuthPort` | `@mirai-app/domain` | Better Auth client interface |
| `TripContextValue` | `contexts/TripContext.tsx` | Trip selection state shape |
| `UseAdminListOptions<T>` | `hooks/useAdminList.ts` | Generic list hook input |
| `UseFileUploadResult` | `hooks/useFileUpload.ts` | File upload hook interface |
| `NotificationPayload` | GraphQL generated | Real-time subscription data |

### Dependencies to Add

```bash
cd apps/web
bun add react-hook-form zod @hookform/resolvers
bun add date-fns
// No tus-js-client needed - using native SeaweedFS Filer TUS
bun add @tamagui/lucide-icons  # If not already present
```

### Integration Points

1. **Better Auth** (`@mirai-app/frameworks/stores`): Session management, OTP flow
2. **GraphQL Client** (`@mirai-app/graphql-client`): Auto-generated hooks from Pothos schema
3. **Tamagui UI** (`@mirai-app/ui`): Shared component library with native app
4. **Effect DI** (`@mirai-app/frameworks/di`): Complex orchestration (judging, coins)
5. **Trip Context**: Multi-tenant data scoping via localStorage

## Initial User Prompt

Look at the way `web` app is implemented in pjapp-main git worktree - reimplement it in new_tech_stack, while taking into account the new tech stack: Effect (DI), Better Auth, SeaweedFS Filer native storage, Tamagui UI and urql hooks (as a replacement for tRPC)

## Description

Reimplement the MIRAI admin web application from pjapp-main into new_tech_stack, migrating from a legacy tech stack (tRPC + Supabase + Tailwind) to a modern, type-safe architecture (GraphQL/urql + Better Auth + Tamagui). This migration eliminates technical debt, improves developer experience, and establishes a unified tech stack across web and mobile platforms.

The current pjapp-main web app serves as the reference implementation with 30+ admin pages including dashboard, user/group management, trip configuration, rewards, challenges with submissions/voting/judging, coins, schedules, notifications, and activity management. The new implementation must achieve 100% feature parity while adopting the Effect-based DI system, Better Auth for OTP authentication, GraphQL with auto-generated urql hooks, Tamagui UI components, and SeaweedFS Filer native TUS for file storage.

**Target Users**: Admin users (trip organizers, staff, judges) who manage trip operations, user accounts, groups, challenges, and rewards. These users require a responsive, reliable interface for daily administrative tasks.

**Key Considerations**: This is a "big bang" migration requiring all pages to be functional before deployment. The GraphQL schema and Better Auth backend are already implemented in new_tech_stack. Migration follows P0-P4 priority order: Foundation (login/layout/middleware), Core CRUD (users/groups), Shared components (file upload), Features (rewards/challenges), and Operations (coins/schedules/notifications/activity).

### Scope

**Included:**
- 30+ admin pages: dashboard, users, groups, trips, rewards, challenges (with submissions/voting/judging), coins, schedules, notifications, activity
- Better Auth integration: email OTP login, session management, logout, role verification
- GraphQL/urql setup: client configuration, auth exchange, subscriptions, auto-generated hooks
- Tamagui UI migration: all components, themes, responsive layouts, mobile navigation
- SeaweedFS Filer native TUS integration: file upload component with progress, resume capability // No tusd
- Trip context system: selector, localStorage persistence, multi-tenant data fetching
- Auth middleware: route protection, redirect handling, role checking

**Excluded:**
- Backend API changes (GraphQL resolvers, Better Auth config, database)
- End-user (participant) web interface
- Mobile application (React Native)
- New features not present in pjapp-main
- Infrastructure/deployment configuration
- Analytics, monitoring, or error tracking setup
- Documentation beyond inline code comments

### User Scenarios

**Primary Flow (Happy Path):**
1. Admin navigates to admin.mirai.app
2. System checks session, redirects to /login if not authenticated
3. Admin enters email and requests OTP
4. System sends OTP via Better Auth
5. Admin enters OTP and logs in
6. System creates session and redirects to dashboard
7. Admin selects trip from trip selector
8. System loads trip context and displays dashboard
9. Admin navigates to Users page
10. System fetches users via urql query
11. Admin creates new user via form
12. System sends mutation, updates cache, shows success

**Alternative Flows:**
- **Trip Switching**: Admin clicks trip selector, selects different trip, system updates localStorage and refreshes page data
- **File Upload**: Admin creates reward with image, selects file (5MB JPG), system starts SeaweedFS upload with progress, upload completes, image URL saved // No tusd

**Error Scenarios:**
- **Invalid OTP**: Admin enters wrong OTP, system shows "Invalid code. Please try again.", admin can retry or request new OTP
- **Session Expired**: Admin inactive for 24 hours attempts navigation, middleware detects expired session, system redirects to login with "Session expired" message
- **GraphQL Error**: Admin performs operation, server returns error, system displays error message in UI, admin can retry
- **File Upload Failure**: Network disconnects during upload, system pauses upload with "Network error", when network returns system auto-resumes, upload completes

## Acceptance Criteria

### P0 - Foundation

- [ ] **AC1: Better Auth Login Flow**
  - **Given**: Admin user with valid email in database
  - **When**: User enters email on login page and requests OTP
  - **Then**: OTP email is sent and success message displayed

- [ ] **AC2: OTP Verification**
  - **Given**: Admin has received OTP via email
  - **When**: User enters correct OTP and submits
  - **Then**: Session is created, user redirected to dashboard

- [ ] **AC3: Session Persistence**
  - **Given**: Admin is logged in and has active session
  - **When**: User reloads page or navigates to new route
  - **Then**: Session remains valid, no re-login required

- [ ] **AC4: Auth Middleware Protection**
  - **Given**: User without valid session
  - **When**: Attempting to access any admin route except /login
  - **Then**: User is redirected to /login with return URL preserved

- [ ] **AC5: Role-Based Access Control**
  - **Given**: User with valid session but non-ADMIN role
  - **When**: Attempting to access any admin route
  - **Then**: 403 Forbidden page is displayed

- [ ] **AC6: Layout Components**
  - **Given**: Admin is logged in and on any admin page
  - **When**: Page renders
  - **Then**: Header with trip selector and MobileNav are visible

- [ ] **AC7: GraphQL Provider Setup**
  - **Given**: Application is initialized
  - **When**: Any component uses urql hooks
  - **Then**: Queries execute successfully with auth token attached

### P1 - Core CRUD (Users & Groups)

- [ ] **AC8: Users List Page**
  - **Given**: Admin is on Users page
  - **When**: Page loads with active trip context
  - **Then**: List of users for selected trip displays within 2 seconds

- [ ] **AC9: Create User**
  - **Given**: Admin is on Create User form
  - **When**: Valid user data is submitted
  - **Then**: User is created, list refreshes, success message shown

- [ ] **AC10: Edit User**
  - **Given**: Admin navigates to existing user's edit page
  - **When**: Valid changes are submitted
  - **Then**: User is updated, changes reflected in list

- [ ] **AC11: Groups List Page**
  - **Given**: Admin is on Groups page
  - **When**: Page loads with active trip context
  - **Then**: List of groups with member counts displays

- [ ] **AC12: Create Group**
  - **Given**: Admin is on Create Group form
  - **When**: Group data and trip are selected
  - **Then**: Group is created and appears in list

- [ ] **AC13: Edit Group**
  - **Given**: Admin is on Edit Group page
  - **When**: Member assignments are modified
  - **Then**: Changes persist and member list updates

### P4 - Shared Components

- [ ] **AC14: Trip Context Persistence**
  - **Given**: Admin has selected a trip
  - **When**: Navigating between pages or reloading
  - **Then**: Selected trip remains active from localStorage

- [ ] **AC15: File Upload Component**
  - **Given**: Admin selects valid image file (JPG/PNG under 50MB)
  - **When**: Upload is initiated
  - **Then**: Progress indicator shows, upload completes, URL returned

- [ ] **AC16: Upload Resume**
  - **Given**: File upload was interrupted at 50%
  - **When**: Network connection restored
  - **Then**: Upload auto-resumes from 50% and completes

### P2 - Features (Rewards & Challenges)

- [ ] **AC17: Rewards CRUD**
  - **Given**: Admin is on Rewards page
  - **When**: Creating reward with image, updating, or deleting
  - **Then**: Operations complete successfully with cache updates

- [ ] **AC18: Challenges List**
  - **Given**: Admin is on Challenges page
  - **When**: Page loads
  - **Then**: Active and past challenges display with status

- [ ] **AC19: Challenge Submissions**
  - **Given**: Admin views challenge submissions
  - **When**: Submission is approved or rejected
  - **Then**: Status updates and participant notified

- [ ] **AC20: Staff Voting**
  - **Given**: Challenge has voting enabled
  - **When**: Admin casts vote on submission
  - **Then**: Vote is recorded and totals updated

- [ ] **AC21: Judging Interface**
  - **Given**: Challenge judging phase is active
  - **When**: Admin assigns scores and ranks
  - **Then**: Judging results calculate correctly

### P3 - Operations

- [ ] **AC22: Coins Overview**
  - **Given**: Admin is on Coins page
  - **When**: Page loads
  - **Then**: Coin balances and transaction history display

- [ ] **AC23: Coin Operations**
  - **Given**: Admin performs coin adjustment
  - **When**: Valid operation is submitted
  - **Then**: Balance updates and transaction logged

- [ ] **AC24: Schedules Page**
  - **Given**: Admin is on Schedules page
  - **When**: Viewing trip schedule
  - **Then**: Timeline/calendar displays activities in correct order

- [ ] **AC25: Notifications**
  - **Given**: Admin creates notification
  - **When**: Sent to target users/groups
  - **Then**: Notification appears in real-time via subscription

- [ ] **AC26: Activity Management**
  - **Given**: Admin manages activities
  - **When**: Creating, editing, or removing activities
  - **Then**: Changes reflect immediately in schedule

### Non-Functional Requirements

- [ ] **AC27: Performance**
  - **Given**: Standard broadband connection
  - **When**: Loading any admin page
  - **Then**: First contentful paint completes within 3 seconds

- [ ] **AC28: Mobile Responsiveness**
  - **Given**: Viewport width of 375px (mobile)
  - **When**: Any admin page renders
  - **Then**: Layout adapts without horizontal scroll, mobile nav visible

- [ ] **AC29: Error Handling**
  - **Given**: GraphQL query fails
  - **When**: Component displays error state
  - **Then**: User sees clear error message with retry option

## Implementation Process

### Execution Directive for Sub-Agents

**CRITICAL: All sub-agents must follow these rules:**

1. **Read Before Write:** Read the existing implementation in pjapp-main worktree before starting
2. **Pattern Consistency:** Follow patterns established in earlier steps - never invent new patterns
3. **Parallel Awareness:** Check "Parallel with" section - coordinate with parallel work streams
4. **Interface Contracts:** Define clear TypeScript interfaces at step boundaries
5. **Daily Sync:** Report blockers within 2 hours, sync daily at standup
6. **Test First:** Write tests for new components before implementation (TDD)
7. **No Scope Creep:** If a requirement is unclear, ask - don't assume additional features

**Agent Selection Criteria:**
- `general:opus` - Complex state machines, SSR compatibility, external integrations, most complex features
- `general:sonnet` - Medium complexity: forms, navigation, CRUD patterns, validation
- `general:haiku` - Trivial: env setup, thin wrappers, utility hooks, simple CRUD following patterns

### Parallelization Diagram

```
Wave 1 (P0 Foundation) - 4 agents in parallel
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Environment (haiku)                                  │
└────────────────────────────┬────────────────────────────────┘
                             │ (triggers parallel wave)
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼              ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ Step 2: Auth  │  │ Step 3: GQL   │  │ Step 4: Layout│  │ Step 6: UI    │
│ (opus)        │  │ (opus)        │  │ (opus)        │  │ (haiku)       │
│ 8h HIGH RISK  │  │ 8h HIGH RISK  │  │ 6h HIGH RISK  │  │ 6h            │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │                  │
        ▼                  ▼                  ▼                  │
┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │
│ Step 5: Login │  │ Step 7: Nav   │  │ Step 8: Trip  │           │
│ (sonnet)      │  │ (sonnet)      │  │ (sonnet)      │◄──────────┘
│ 6h            │  │ 6h            │  │ 6h            │  Parallel
└───────┬───────┘  └───────────────┘  └───────┬───────┘  with Step 6
        │                                    │
        │         ┌──────────────────────────┘
        │         ▼
        │  ┌───────────────┐
        │  │ Step 9: Users │     ┌──────────────────┐
        │  │ (sonnet)      │────►│ Step 11: List    │
        │  │ 12h           │ 50% │ Hook (haiku) 4h  │
        │  └───────┬───────┘     └──────────────────┘
        │          │
        │          ▼
        │  ┌───────────────┐      ┌──────────────────┐
        │  │ Step 10:Groups│      │ Step 12: Upload  │
        │  │ (haiku)       │      │ (opus) 10h HIGH  │
        │  │ 8h            │      │ External dep     │
        │  └───────┬───────┘      └────────┬─────────┘
        │          │                       │
        │          ▼                       ▼
        │  ┌───────────────┐      ┌───────────────┐
        │  │ Step 13: Val. │      │ Step 14: Rwd  │
        │  │ (sonnet)      │      │ (sonnet)      │
        │  │ 8h            │      │ 6h            │
        │  └───────┬───────┘      └───────┬───────┘
        │          │                       │
        └──────────┴───────────────────────┘
                             │
                             ▼
                   ┌───────────────────┐
                   │ Step 15: Challenges│
                   │ (opus) 16h HIGH   │
                   │ Most complex      │
                   └─────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ Step 16: Coins│  │ Step 17: Notif│  │ Step 18: Sched│
│ (haiku) 6h    │  │ (haiku) 8h    │  │ (haiku) 8h    │
└───────────────┘  └───────────────┘  └───────────────┘
        PARALLEL WAVE (3 agents)
```

### Wave-Based Execution

**Wave 1 - Foundation (Max 4 parallel agents):**
Steps 2, 3, 4, 6 can all start immediately after Step 1 completes. These are independent technical foundations.

**Wave 2 - Navigation (Max 3 parallel agents):**
Steps 5 and 7 are independent. Step 8 depends on Step 6 and Step 3.

**Wave 3 - Core CRUD (Max 2 parallel agents):**
Step 9 is the pattern-establishing step. Step 11 can start at 50% completion of Step 9.

**Wave 4 - Feature CRUD (Max 2 parallel agents):**
Step 10 and Step 12 run in parallel. Step 13 starts after Step 9.

**Wave 5 - Complex Features (1 agent):**
Step 15 is the most complex feature, sequential after Step 13 and Step 14.

**Wave 6 - Operations (Max 3 parallel agents):**
Steps 16, 17, 18 are independent CRUD operations that can run in parallel.

### Critical Path Analysis

```
P0: Foundation ──────────────────────────────────────────────────────────────►
├── Step 1: Environment & Config
├── Step 2: Better Auth Integration
├── Step 3: GraphQL Client Setup
├── Step 4: Layout Shell
├── Step 5: Login Page
│
P1: Core CRUD ──────────────────────────────────────────────────────────────►
├── Step 6: UI Primitives
├── Step 7: Navigation & Shell UI
├── Step 8: Trip Context System
├── Step 9: Users CRUD
├── Step 10: Groups CRUD
│
P4: Shared Components ─────────────────────────────────────────────────────►
├── Step 11: Admin List Hook
├── Step 12: File Upload
├── Step 13: Validation & Admin Hooks
│
P2: Features ───────────────────────────────────────────────────────────────►
├── Step 14: Rewards CRUD
├── Step 15: Challenges (Submissions, Voting, Judging)
│
P3: Operations ───────────────────────────────────────────────────────────────►
├── Step 16: Coins
├── Step 17: Notifications
├── Step 18: Schedules & Activity
```

---

### Implementation Steps

#### Step 1: Environment & Config (P0)

**Goal**: Establish foundation configuration and environment variables for the new tech stack.

**Output**: Environment configuration module and Astro configuration updates.

**Agent Assignment**: `general:haiku` (trivial complexity - Zod schema, config files)

**Dependencies**: None - self-contained step, all other steps depend on this

**Parallel With**: N/A - first step, triggers Wave 1

**Success Criteria**:
- [ ] Environment variables validated with Zod schema
- [ ] Type-safe env export available across the app
- [ ] Astro optimized for React component hydration

**Subtasks**:
1. Create `apps/web/src/lib/env.ts` with Zod environment schema (include Better Auth, GraphQL, SeaweedFS URLs)
2. Update `apps/web/astro.config.mjs` with React integration and Vite optimizeDeps
3. Add environment variable validation in build process
4. Update `.env.example` with all required variables

**Blockers**: None - self-contained step

**Risks**: Missing environment variables in deployment pipeline
**Mitigation**: Document all required env vars in AGENTS.md

**Completion Signal:** env.ts exports type-safe config, astro.config.mjs updated

**LLM-as-Judge Verification:** None
- Verification Level: None
- Rationale: Configuration-only step; build system validates via type checking and Zod schema validation

---

#### Step 2: Better Auth Integration (P0)

**Goal**: Implement Better Auth client with OTP flow and session management.

**Output**: Auth utilities and middleware protecting all admin routes.

**Agent Assignment**: `general:opus` (HIGH complexity - OTP state machine, session management, security-critical)

**Dependencies**: 
- Step 1 (Environment) - must have env config
- Backend Better Auth endpoints must be available (verify before starting)

**Parallel With**: Step 3 (GraphQL Client), Step 4 (Layout Shell), Step 6 (UI Primitives)

**Success Criteria**:
- [ ] Email OTP login flow functional
- [ ] Session persistence across page reloads
- [ ] Middleware redirects unauthenticated users to /login
- [ ] Role-based access control enforces ADMIN role

**Subtasks**:
1. Create `apps/web/src/lib/auth.ts` with Better Auth client configuration
2. Implement `apps/web/src/middleware.ts` with session validation and role checking
3. Create auth helper functions for OTP request and verification
4. Add session storage utilities for cookie handling
5. Implement logout functionality

**Blockers**:
- Backend Better Auth endpoints must be available
- Resolution: Verify with backend team before starting

**Risks**: 
- **HIGH**: OTP flow state management complexity
- **HIGH**: Session edge cases (expired tokens, refresh)

**Mitigation**:
- Use Effect patterns for async auth operations
- Implement comprehensive error handling for each auth state
- Add unit tests for all auth state transitions

**Interface Contract:**
```typescript
// Exports from auth.ts for dependent steps
export interface AuthClient {
  signInWithOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, code: string) => Promise<Session>;
  signOut: () => Promise<void>;
  getSession: () => Promise<Session | null>;
}
export interface Session {
  token: string;
  user: { id: string; email: string; role: string };
}
```

**Completion Signal:** Login flow works end-to-end, middleware rejects unauthenticated requests

**LLM-as-Judge Verification:** Panel Evaluation
- Verification Level: Panel (3 independent evaluators)
- Threshold Score: 4.0/5.0
- Custom Rubric:
  - **Security** (30%, weight 0.30): No token exposure in client code, secure cookie flags set, CSRF protection implemented
  - **Correctness** (25%, weight 0.25): OTP state machine handles all transitions (request → pending → verify → success → error), session refresh works automatically
  - **Type Safety** (20%, weight 0.20): Session types strict with no any types, error types extend Data.TaggedError, branded types for session IDs
  - **Integration** (15%, weight 0.15): Better Auth client configured correctly, middleware covers all admin routes including wildcard paths
  - **Error Handling** (10%, weight 0.10): Auth errors display user-friendly messages, retry logic for network failures, graceful degradation when auth service unavailable
- Evaluation Focus: Security vulnerabilities, OTP state machine completeness, session edge cases (expiry, refresh), middleware coverage

---

#### Step 3: GraphQL Client Setup (P0)

**Goal**: Configure urql client with auth exchange, cache, and subscription support.

**Output**: GraphQL client configuration and provider components.

**Agent Assignment**: `general:opus` (HIGH complexity - caching, subscriptions, auth integration)

**Dependencies**: 
- Step 1 (Environment) - must have GraphQL endpoint URL
- GraphQL schema must be generated and stable

**Parallel With**: Step 2 (Better Auth), Step 4 (Layout Shell), Step 6 (UI Primitives)

**Success Criteria**:
- [ ] urql client attaches Bearer token to all requests
- [ ] Cache normalized with graphcache
- [ ] WebSocket subscriptions functional for real-time features
- [ ] Error handling for GraphQL network errors

**Subtasks**:
1. Create `apps/web/src/lib/graphql-client.ts` with urql client factory
2. Implement authExchange for attaching tokens from session
3. Configure cacheExchange with graphcache normalized caching
4. Set up subscriptionExchange for WebSocket connections
5. Create `apps/web/src/components/providers/GraphQLProvider.tsx` as React context wrapper

**Blockers**:
- GraphQL schema must be generated and stable
- Resolution: Coordinate with backend team for schema freeze

**Risks**:
- **HIGH**: Cache invalidation patterns different from tRPC
- **MEDIUM**: WebSocket connection stability in production

**Mitigation**:
- Document cache policy decisions in code comments
- Implement reconnection logic for WebSocket
- Add fallback polling for subscriptions

**Interface Contract:**
```typescript
// Exports from graphql-client.ts for dependent steps
export interface GraphQLClient {
  query: <T>(query: DocumentNode, variables?: object) => Promise<T>;
  mutation: <T>(mutation: DocumentNode, variables?: object) => Promise<T>;
  subscription: <T>(subscription: DocumentNode, callback: (data: T) => void) => () => void;
}
export const createClient: (getToken: () => string | null) => Client;
```

**Completion Signal:** Queries execute with auth tokens, cache updates work, subscriptions connect

**LLM-as-Judge Verification:** Panel Evaluation
- Verification Level: Panel (3 independent evaluators)
- Threshold Score: 4.0/5.0
- Custom Rubric:
  - **Type Safety** (30%, weight 0.30): Generated GraphQL types used exclusively, no manual type assertions, generic hooks properly constrained
  - **Caching** (25%, weight 0.25): Cache policies documented and correct, mutation updaters invalidate affected queries, normalized cache keys consistent
  - **Integration** (20%, weight 0.20): Auth exchange attaches Bearer tokens to all requests, subscriptionExchange connects WebSocket with reconnection logic
  - **Error Handling** (15%, weight 0.15): Network errors display user-friendly messages, query retry logic with exponential backoff, subscription fallbacks to polling
  - **Performance** (10%, weight 0.10): Query deduplication enabled, cache normalization efficient, request batching configured if applicable
- Evaluation Focus: Cache invalidation correctness, WebSocket stability, auth token attachment on all requests, error recovery

---

#### Step 4: Layout Shell (P0)

**Goal**: Create application shell with Tamagui provider and admin layout structure.

**Output**: Layout components that wrap all admin pages.

**Agent Assignment**: `general:opus` (HIGH complexity - SSR + Tamagui compatibility, theme handling)

**Dependencies**: 
- Step 1 (Environment) - for Tamagui config
- @mirai-app/ui package must have Tamagui components exported

**Parallel With**: Step 2 (Better Auth), Step 3 (GraphQL Client), Step 6 (UI Primitives)

**Success Criteria**:
- [ ] TamaguiProvider wraps entire app with theme support
- [ ] AdminLayout provides consistent navigation structure
- [ ] Mobile responsive layout adapts to viewport
- [ ] Astro SSR hydrates React components correctly

**Subtasks**:
1. Create `apps/web/src/layouts/Layout.astro` with TamaguiProvider wrapper
2. Create `apps/web/src/layouts/AdminLayout.astro` with header/footer structure
3. Create `apps/web/src/components/providers/GlobalProviders.tsx` for combining all providers
4. Configure Tamagui themes (light/dark mode)
5. Test SSR hydration with React components

**Blockers**:
- @mirai-app/ui package must have Tamagui components exported
- Resolution: Verify UI package exports

**Risks**:
- **HIGH**: Tamagui SSR compatibility with Astro
- **MEDIUM**: Theme flash on initial load

**Mitigation**:
- Test SSR early with simple components
- Use CSS variables for theme to prevent flash
- Document Tamagui + Astro patterns

**Interface Contract:**
```typescript
// Layout components export
export interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  requireAuth?: boolean;
}
// AdminLayout extends LayoutProps with trip context requirement
```

**Completion Signal:** Pages render with Tamagui theme, no SSR errors, layout structure visible

**LLM-as-Judge Verification:** Panel Evaluation
- Verification Level: Panel (3 independent evaluators)
- Threshold Score: 4.0/5.0
- Custom Rubric:
  - **SSR Compatibility** (30%, weight 0.30): No hydration mismatches between server/client, client:load directive used correctly for interactive components, no window/document access during SSR
  - **UX** (25%, weight 0.25): No theme flash on initial load (CSS variables prevent FOUC), responsive breakpoints match design system, consistent spacing
  - **Integration** (20%, weight 0.20): TamaguiProvider configured with correct theme tokens, all Tamagui components hydrate without errors, Astro React integration correct
  - **Performance** (15%, weight 0.15): Minimal JavaScript on initial page load, lazy loading for non-critical components, no render-blocking resources
  - **Accessibility** (10%, weight 0.10): Semantic HTML structure, ARIA landmarks for navigation, focus management defined
- Evaluation Focus: SSR hydration correctness, theme flash prevention, Tamagui + Astro compatibility, mobile responsive behavior

---

#### Step 5: Login Page (P0)

**Goal**: Implement OTP-based login page with form validation.

**Output**: Complete login flow UI and backend integration.

**Agent Assignment**: `general:sonnet` (medium complexity - forms, validation, auth integration)

**Dependencies**: 
- Step 2 (Better Auth) - MUST be complete, exports auth utilities

**Parallel With**: Step 7 (Navigation), Step 8 (Trip Context) - can run in parallel

**Success Criteria**:
- [ ] Email input validates format
- [ ] OTP request triggers email delivery
- [ ] OTP verification authenticates user
- [ ] Redirect to dashboard on successful login
- [ ] Error messages display for invalid OTP

**Subtasks**:
1. Create `apps/web/src/pages/login.astro` as entry point
2. Create `apps/web/src/components/LoginForm.tsx` with email/OTP forms
3. Create `apps/web/src/components/LoginApp.tsx` as page-level component
4. Create `apps/web/src/pages/index.astro` as dashboard redirect target
5. Implement form validation with Zod
6. Add loading states and error handling

**Blockers**:
- Step 2 (Better Auth) must be complete
- Resolution: Sequential dependency

**Risks**: 
- **MEDIUM**: Form state management complexity

**Mitigation**:
- Use react-hook-form for form state
- Implement optimistic UI for better UX

**Interface Consumed:**
- Import `{ signInWithOTP, verifyOTP }` from `lib/auth.ts` (Step 2)

**Completion Signal:** End-to-end login works, redirects to dashboard

**LLM-as-Judge Verification:** Per-Task Evaluation
- Verification Level: Single-item per-task (1 evaluator)
- Threshold Score: 3.8/5.0
- Custom Rubric:
  - **Form Correctness** (30%, weight 0.30): Email validation with Zod works, OTP input accepts only digits, form state persists across OTP request/verify phases
  - **Auth Integration** (25%, weight 0.25): Correctly imports signInWithOTP and verifyOTP from lib/auth.ts, session handling after successful OTP, redirect to dashboard with return URL
  - **UX** (25%, weight 0.25): Loading states during OTP operations, error messages for invalid OTP, success feedback before redirect, resend OTP functionality
  - **Type Safety** (15%, weight 0.15): Form inputs typed, Zod schema types inferred, no any types
  - **Accessibility** (5%, weight 0.05): Form labels associated with inputs, error messages linked to fields, keyboard navigation works
- Evaluation Focus: Form state management across OTP phases, error handling for invalid codes, redirect behavior, loading states

---

#### Step 6: UI Primitives (P0-P1)

**Goal**: Create wrapper components for @mirai-app/ui Tamagui primitives.

**Output**: Reusable UI component library for admin pages.

**Agent Assignment**: `general:haiku` (trivial complexity - thin wrappers, passthrough props)

**Dependencies**: 
- @mirai-app/ui package must be available
- No other step dependencies - can start with Step 1

**Parallel With**: Step 2 (Better Auth), Step 3 (GraphQL Client), Step 4 (Layout Shell)

**Success Criteria**:
- [ ] All basic UI primitives available (Button, Card, Input, Select)
- [ ] Components accept same props as base Tamagui components
- [ ] Consistent styling across all components
- [ ] Mobile touch targets meet accessibility standards

**Subtasks**:
1. Create `apps/web/src/components/ui/Button.tsx` wrapping @mirai-app/ui Button
2. Create `apps/web/src/components/ui/Card.tsx` wrapping @mirai-app/ui Card
3. Create `apps/web/src/components/ui/Input.tsx` wrapping @mirai-app/ui Input
4. Create `apps/web/src/components/ui/Select.tsx` wrapping @mirai-app/ui Select
5. Create `apps/web/src/components/ui/Sheet.tsx` for modal/sheet dialogs
6. Create `apps/web/src/components/ui/Text.tsx` for typography
7. Create `apps/web/src/components/ui/LoadingSpinner.tsx` loading indicator
8. Create `apps/web/src/components/ui/ErrorMessage.tsx` error display component

**Blockers**: None - depends only on @mirai-app/ui being available

**Risks**: 
- **MEDIUM**: Wrapper overhead may obscure Tamagui features

**Mitigation**:
- Keep wrappers thin (just pass through props)
- Document when to use wrappers vs direct imports

**Interface Contract:**
```typescript
// All UI components re-export with web-specific defaults
export { Button, ButtonProps } from './ui/Button';
export { Card, CardProps } from './ui/Card';
// ... etc
```

**Completion Signal:** All UI primitives render correctly in isolation

**LLM-as-Judge Verification:** Per-Item Spot-Check
- Verification Level: Per-item spot-check (3 key components: Button, Input, Card)
- Threshold Score: 3.5/5.0 per component
- Custom Rubric per Component:
  - **Prop Pass-through** (40%, weight 0.40): All base component props forwarded correctly, no prop loss, ref forwarding works
  - **Type Safety** (30%, weight 0.30): Props re-exported with correct types, web-specific defaults typed, no any types
  - **Consistency** (20%, weight 0.20): Naming follows Button/Card/Input convention, exports match pattern across all components
  - **Documentation** (10%, weight 0.10): JSDoc for component props, usage example in comments
- Evaluation Focus: Prop forwarding correctness, type re-exports, web-specific defaults applied consistently
- Spot-Check Strategy: Evaluate Button (most used), Input (complex props), Card (composition pattern)

---

#### Step 7: Navigation & Shell UI (P1)

**Goal**: Implement navigation components for desktop and mobile.

**Output**: Complete navigation shell with trip selector.

**Agent Assignment**: `general:sonnet` (medium complexity - responsive design, state management)

**Dependencies**: 
- Step 4 (Layout Shell) - MUST be complete, provides AdminLayout structure

**Parallel With**: Step 5 (Login Page) - no shared dependencies

**Success Criteria**:
- [ ] Sidebar displays on desktop with all navigation links
- [ ] Mobile navigation accessible via hamburger menu
- [ ] Header displays trip selector and user info
- [ ] Navigation highlights active route
- [ ] All admin routes listed in navigation

**Subtasks**:
1. Create `apps/web/src/components/Sidebar.tsx` with navigation links
2. Create `apps/web/src/components/Header.tsx` with trip selector placeholder
3. Create `apps/web/src/components/MobileNav.tsx` responsive navigation
4. Add navigation state management
5. Implement active route highlighting
6. Add logout button in header

**Blockers**:
- Step 4 (Layout Shell) must be complete
- Resolution: Sequential dependency

**Risks**: 
- **MEDIUM**: Mobile navigation UX complexity

**Mitigation**:
- Test on actual mobile devices early
- Follow mobile-first design patterns

**Interface Consumed:**
- Import `{ AdminLayout }` from layouts (Step 4)
- Import UI components from `components/ui/*` (Step 6)

**Completion Signal:** Navigation renders on all viewports, route highlighting works

**LLM-as-Judge Verification:** Per-Task Evaluation
- Verification Level: Single-item per-task (1 evaluator)
- Threshold Score: 3.8/5.0
- Custom Rubric:
  - **UX** (30%, weight 0.30): Sidebar navigation intuitive on desktop, mobile hamburger menu accessible, active route clearly highlighted, trip selector visible in header
  - **Responsive** (25%, weight 0.25): Breakpoints at correct widths (mobile <768px, tablet, desktop), touch targets minimum 44px, layout adapts without horizontal scroll
  - **Integration** (20%, weight 0.20): Trip selector placeholder integrates with Step 8, logout button calls auth signOut, navigation links use correct routes
  - **Accessibility** (20%, weight 0.20): Keyboard navigation between nav items, ARIA current page indicator, focus management on mobile menu open/close
  - **Performance** (5%, weight 0.05): Navigation doesn't cause full page reload, no unnecessary re-renders when changing routes
- Evaluation Focus: Mobile navigation UX, responsive behavior across breakpoints, accessibility compliance, route highlighting

---

#### Step 8: Trip Context System (P1)

**Goal**: Implement trip selection context with localStorage persistence.

**Output**: TripContext provider and selector component.

**Agent Assignment**: `general:sonnet` (medium complexity - context API, localStorage, GraphQL integration)

**Dependencies**: 
- Step 3 (GraphQL Client) - for trip list queries
- Step 6 (UI Primitives) - for TripSelector component
- GraphQL queries for trip list must be available

**Parallel With**: Step 5 (Login Page), Step 7 (Navigation) - can run with Step 7

**Success Criteria**:
- [ ] Trip selection persists across page reloads
- [ ] Trip selector displays available trips
- [ ] All data fetching scoped to selected trip
- [ ] Trip change triggers data refresh
- [ ] Graceful handling when no trips available

**Subtasks**:
1. Create `apps/web/src/contexts/TripContext.tsx` with React Context
2. Create `apps/web/src/components/TripSelector.tsx` dropdown component
3. Implement localStorage persistence for selected trip
4. Add trip change listener for data refresh
5. Create `apps/web/src/hooks/useTripContext.ts` convenience hook
6. Handle empty state when user has no trips

**Blockers**:
- GraphQL queries for trip list must be available
- Resolution: Verify schema has user trips query

**Risks**:
- **MEDIUM**: localStorage sync issues with SSR

**Mitigation**:
- Use client:load directive for trip selector
- Implement hydration-safe localStorage access

**Interface Contract:**
```typescript
// TripContext.tsx exports
export interface TripContextValue {
  selectedTrip: Trip | null;
  setSelectedTrip: (trip: Trip) => void;
  trips: Trip[];
  loading: boolean;
}
export interface Trip {
  id: string;
  name: string;
}
```

**Interface Consumed:**
- Import GraphQL client from `lib/graphql-client.ts` (Step 3)
- Import `{ Select }` from `components/ui/Select.tsx` (Step 6)

**Completion Signal:** Trip persists in localStorage, selector displays trips

**LLM-as-Judge Verification:** Panel Evaluation
- Verification Level: Panel (3 independent evaluators)
- Threshold Score: 3.8/5.0
- Custom Rubric:
  - **Type Safety** (30%, weight 0.30): TripContextValue interface strict, Trip type branded, no any types, useTripContext hook typed with generic constraints
  - **SSR Safety** (25%, weight 0.25): localStorage access wrapped in useEffect, no SSR/client hydration mismatch, client:load directive on TripSelector
  - **Integration** (25%, weight 0.25): GraphQL trip list query uses correct generated types, trip change triggers data refetch, all downstream queries include tripId filter
  - **Persistence** (15%, weight 0.15): localStorage key namespaced (mirai:trip:selected), storage event listeners for multi-tab sync, graceful fallback when localStorage unavailable
  - **UX** (5%, weight 0.05): Trip change shows loading state, empty state when no trips available, selector disabled during loading
- Evaluation Focus: localStorage SSR sync, GraphQL query integration with trip filter, multi-tenant data scoping correctness, persistence edge cases

---

#### Step 9: Users CRUD (P1)

**Goal**: Implement complete user management pages with GraphQL integration.

**Output**: Users list, create, and edit pages.

**Agent Assignment**: `general:sonnet` (medium complexity - CRUD patterns, cache management)

**Dependencies**: 
- Step 3 (GraphQL Client) - MUST be complete
- Step 6 (UI Primitives) - MUST be complete
- Step 8 (Trip Context) - MUST be complete

**Parallel With**: Step 10 starts when pattern established (~50%)

**Success Criteria**:
- [ ] Users list displays all users for selected trip
- [ ] List loads within 2 seconds
- [ ] Create user form validates input
- [ ] Edit user form pre-fills existing data
- [ ] Changes reflect immediately in list (cache update)
- [ ] Success/error feedback for all operations

**Subtasks**:
1. Create `apps/web/src/components/admin/users/UsersPage.tsx` list page
2. Create `apps/web/src/components/admin/users/UsersPageContent.tsx` content component
3. Create `apps/web/src/components/admin/users/UserCard.tsx` card component
4. Create `apps/web/src/components/admin/users/CreateUserForm.tsx` create form
5. Create `apps/web/src/components/admin/users/EditUserForm.tsx` edit form
6. Create `apps/web/src/components/admin/users/CreateUserContent.tsx` create page wrapper
7. Create `apps/web/src/components/admin/users/EditUserContent.tsx` edit page wrapper
8. Implement useGetUsersQuery and useCreateUserMutation hooks
9. Add form validation with Zod schemas
10. Implement cache updates after mutations

**Blockers**:
- Step 3 (GraphQL Client) must be complete
- Step 8 (Trip Context) must be complete
- Step 6 (UI Primitives) must be complete
- Resolution: Sequential dependencies

**Risks**:
- **MEDIUM**: Cache invalidation after user mutations

**Mitigation**:
- Use urql's cacheExchange updater functions
- Test cache behavior explicitly

**Interface Contract (Pattern for Step 10, 14, 16-18):**
```typescript
// Users CRUD exports - pattern for other modules
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  tripId: string;
}
export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
}
export interface UpdateUserInput extends Partial<CreateUserInput> {
  id: string;
}
```

**Interface Consumed:**
- Import GraphQL hooks from generated client (Step 3)
- Import `{ useTripContext }` from `contexts/TripContext.tsx` (Step 8)
- Import UI components from `components/ui/*` (Step 6)

**Completion Signal:** Full Users CRUD works end-to-end, pattern documented

**LLM-as-Judge Verification:** Panel Evaluation
- Verification Level: Panel (3 independent evaluators)
- Threshold Score: 3.8/5.0
- Custom Rubric:
  - **Pattern Establishment** (30%, weight 0.30): Directory structure establishes pattern (/admin/entity/), component naming consistent (EntityPage, EntityPageContent, EntityCard, CreateEntityForm), exports follow barrel pattern
  - **Type Safety** (25%, weight 0.25): User type branded, CreateUserInput/UpdateUserInput typed from Zod schemas, GraphQL hooks use generated types, no any types
  - **Cache Management** (20%, weight 0.20): Cache updates after create/edit/delete, list refetch on mutation success, no stale data after mutations, urql updaters configured
  - **UX** (15%, weight 0.15): Loading states on list and forms, error messages display, success feedback after operations, form validation errors linked to fields
  - **Integration** (10%, weight 0.10): Trip context filters users correctly, GraphQL queries include tripId, forms submit to correct mutations
- Evaluation Focus: Pattern completeness for downstream steps (Groups, Rewards, etc.), cache invalidation correctness, form validation, trip-scoped data fetching

---

#### Step 10: Groups CRUD (P1)

**Goal**: Implement group management following same pattern as Users.

**Output**: Groups list, create, and edit pages.

**Agent Assignment**: `general:haiku` (trivial complexity - follows established Users pattern)

**Dependencies**: 
- Step 9 (Users CRUD) - pattern established, can follow same structure

**Parallel With**: Step 12 (File Upload) - runs in parallel

**Success Criteria**:
- [ ] Groups list displays with member counts
- [ ] Create group assigns to selected trip
- [ ] Edit group manages member assignments
- [ ] Changes persist and update list

**Subtasks**:
1. Create `apps/web/src/components/admin/groups/GroupsPage.tsx` list page
2. Create `apps/web/src/components/admin/groups/GroupsPageContent.tsx` content component
3. Create `apps/web/src/components/admin/groups/GroupCard.tsx` card component
4. Create `apps/web/src/components/admin/groups/CreateGroupForm.tsx` create form
5. Create `apps/web/src/components/admin/groups/EditGroupForm.tsx` edit form
6. Implement GraphQL queries and mutations for groups
7. Add member assignment UI in edit form

**Blockers**:
- Step 9 (Users CRUD) provides the pattern to follow
- Resolution: Can start once Users pattern established

**Risks**: Low - follows established pattern

**Interface Consumed:**
- Copy pattern from `components/admin/users/*` (Step 9)
- Import all same dependencies as Users

**Completion Signal:** Full Groups CRUD works, mirrors Users pattern

**LLM-as-Judge Verification:** Per-Task Evaluation
- Verification Level: Single-item per-task (1 evaluator)
- Threshold Score: 3.5/5.0
- Custom Rubric:
  - **Pattern Compliance** (40%, weight 0.40): Directory structure matches Users (/admin/groups/), component names follow Users pattern, file organization identical
  - **Type Safety** (25%, weight 0.25): Group types branded, CreateGroupInput/UpdateUserInput typed, imports correct types from Step 9 pattern
  - **Feature Parity** (25%, weight 0.25): Member management UI present (unique to Groups), member counts display, member assignment in edit form
  - **Integration** (10%, weight 0.10): Trip context integration works, GraphQL queries functional, cache updates after mutations
- Evaluation Focus: Strict adherence to Users pattern, member management features (Groups-specific), type consistency

---

#### Step 11: Admin List Hook (P4)

**Goal**: Create reusable hook for paginated admin list views.

**Output**: Generic useAdminList hook for CRUD list pages.

**Agent Assignment**: `general:haiku` (trivial complexity - utility hook, generic types)

**Dependencies**: 
- Step 9 (Users CRUD) - provides requirements, can start at ~50% of Step 9

**Parallel With**: Can run MIDWAY through Step 9 (pattern established)

**Success Criteria**:
- [ ] Hook accepts query/mutation configuration
- [ ] Handles loading, error, and empty states
- [ ] Supports pagination
- [ ] Type-safe with generics

**Subtasks**:
1. Create `apps/web/src/hooks/useAdminList.ts` with generic implementation
2. Define UseAdminListOptions interface
3. Implement loading state handling
4. Add pagination support
5. Create example usage in UsersPage

**Blockers**:
- Step 9 (Users CRUD) provides requirements
- Resolution: Can develop alongside Users CRUD (start at 50%)

**Risks**: Low - utility hook

**Interface Contract:**
```typescript
// useAdminList.ts exports
export interface UseAdminListOptions<T, F> {
  query: DocumentNode;
  filter?: F;
  pageSize?: number;
}
export interface UseAdminListResult<T> {
  items: T[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
}
export function useAdminList<T, F>(options: UseAdminListOptions<T, F>): UseAdminListResult<T>;
```

**Completion Signal:** Hook works with Users list, typed correctly

**LLM-as-Judge Verification:** Per-Task Evaluation
- Verification Level: Single-item per-task (1 evaluator)
- Threshold Score: 3.5/5.0
- Custom Rubric:
  - **Type Safety** (35%, weight 0.35): Generic T and F properly constrained, UseAdminListOptions interface generic, return type UseAdminListResult<T> correct, inference works without explicit types
  - **Correctness** (30%, weight 0.30): Loading state transitions correct, error state handled, pagination loadMore increments correctly, refetch clears cache and re-queries
  - **API Design** (20%, weight 0.20): Interface intuitive (items, loading, error, hasMore, loadMore, refetch), return shape matches urql patterns, options flexible for different entities
  - **Documentation** (15%, weight 0.15): JSDoc explains generic parameters, usage example in comments, pagination logic documented
- Evaluation Focus: Generic type constraints, pagination logic correctness, reusability across different entity types

---

#### Step 12: File Upload (P4)

**Goal**: Implement resumable file upload with SeaweedFS Filer native TUS support.

**Output**: File upload hook and component with progress indication.

**Agent Assignment**: `general:opus` (HIGH complexity - SeaweedFS Filer native TUS integration, resume logic, external service)

**Dependencies**: 
- SeaweedFS Filer native TUS endpoints must be available
- GraphQL mutation for upload URL must be ready

**Parallel With**: Step 10 (Groups CRUD) - runs in parallel, external dependency

**Success Criteria**:
- [x] File selection accepts JPG/PNG under 50MB
- [x] Upload progress displays in real-time
- [x] Uploads resume after network interruption
- [x] Completed upload returns file URL
- [x] Error handling for upload failures

**Subtasks**:
1. Create `apps/web/src/hooks/useFileUpload.ts` with SeaweedFS Filer native TUS client
2. Create `apps/web/src/components/FileUpload.tsx` UI component
3. Implement progress tracking
4. Add resume capability
5. Define UseFileUploadResult interface
6. Add file validation (type, size)
7. Test network interruption recovery

**Blockers**:
- SeaweedFS Filer native TUS endpoints must be available
- GraphQL mutation for upload URL must be ready
- Resolution: Verify backend before starting

**Risks**:
- **HIGH**: SeaweedFS Filer native TUS resume implementation complexity
- **MEDIUM**: Progress UI state management

**Mitigation**:
- Test resume functionality thoroughly
- Use Effect for upload orchestration
- Document network failure scenarios

**Interface Contract:**
```typescript
// useFileUpload.ts exports
export interface UseFileUploadResult {
  upload: (file: File) => Promise<string>; // returns URL
  progress: number;
  status: 'idle' | 'uploading' | 'paused' | 'completed' | 'error';
  error: Error | null;
  pause: () => void;
  resume: () => void;
}
export function useFileUpload(): UseFileUploadResult;

// FileUpload.tsx props
export interface FileUploadProps {
  onUpload: (url: string) => void;
  accept?: string;
  maxSize?: number;
}
```

**Completion Signal:** Uploads work with resume, progress displays, URL returned

**LLM-as-Judge Verification:** Panel Evaluation
- Verification Level: Panel (3 independent evaluators)
- Threshold Score: 4.0/5.0
- Custom Rubric:
  - **Integration** (30%, weight 0.30): SeaweedFS Filer native TUS client configured correctly with endpoint, GraphQL mutation gets upload URL properly, SeaweedFS integration works, file size validation before upload
  - **State Management** (25%, weight 0.25): Progress tracking accurate (0-100%), status transitions correct (idle → uploading → paused → completed/error), pause/resume functions work
  - **UX** (20%, weight 0.20): Progress indicator visible and styled, file name displays, error messages clear, success state shows file URL
  - **Error Handling** (15%, weight 0.15): Network failures detected and pause upload, auto-resume on network reconnect, retry logic with backoff, max retry limit
  - **Type Safety** (10%, weight 0.10): UseFileUploadResult interface complete, upload function returns Promise<string> for URL, status type union correct
- Evaluation Focus: SeaweedFS Filer native TUS resume implementation (critical complexity), progress accuracy across network interruptions, error recovery, external service integration

---

#### Step 13: Validation & Admin Hooks (P4)

**Goal**: Create shared validation schemas and specialized admin hooks.

**Output**: Zod validators and complex operation hooks.

**Agent Assignment**: `general:sonnet` (medium complexity - validation logic, Effect DI integration)

**Dependencies**: 
- Step 9 (Users CRUD) - must be complete
- Effect DI patterns must be understood for judging hook

**Parallel With**: Can run parallel with Step 10, Step 12 (starts after Step 9)

**Success Criteria**:
- [ ] All forms use shared Zod schemas
- [ ] Challenge form hook handles complex validation
- [ ] Judgement hook integrates with Effect DI

**Subtasks**:
1. Create `apps/web/src/lib/validators.ts` with Zod schemas
2. Create `apps/web/src/hooks/admin/useChallengeForm.ts` for challenge operations
3. Create `apps/web/src/hooks/admin/useJudgement.ts` for judging orchestration
4. Export shared validators from index

**Blockers**:
- Effect DI patterns must be understood for judging hook
- Resolution: Review use-cases layer patterns

**Risks**:
- **HIGH**: Effect DI integration complexity for judging

**Mitigation**:
- Pair with use-cases developer for judging hook
- Document Effect patterns used

**Interface Contract:**
```typescript
// validators.ts exports
export const createUserSchema: z.ZodSchema<CreateUserInput>;
export const createGroupSchema: z.ZodSchema<CreateGroupInput>;
export const challengeFormSchema: z.ZodSchema<ChallengeFormInput>;

// useJudgement.ts exports
export interface UseJudgementResult {
  submitJudgement: (submissionId: string, score: number) => Promise<void>;
  loading: boolean;
}
```

**Completion Signal:** Validators used in forms, judging hook connects to Effect DI

**LLM-as-Judge Verification:** Panel Evaluation
- Verification Level: Panel (3 independent evaluators)
- Threshold Score: 3.8/5.0
- Custom Rubric:
  - **Correctness** (30%, weight 0.30): Zod schemas match domain constraints (email regex, name length, required fields), validation errors display correctly, schemas exported and reused
  - **Effect Integration** (30%, weight 0.30): useJudgement hook correctly accesses DI context with yield* AuthPortTag, layers composed properly with Layer.provide, Effect.gen used for async operations
  - **Type Safety** (20%, weight 0.20): Effect types inferred correctly, Error types tagged with Data.TaggedError, no any types, UseJudgementResult interface strict
  - **Testability** (15%, weight 0.15): Hooks work with mock layers in tests, Effect test patterns followed, no hidden dependencies
  - **Documentation** (5%, weight 0.05): Effect patterns documented, judging flow explained, error handling strategy noted
- Evaluation Focus: Effect DI context access correctness, Zod schema completeness, judging orchestration accuracy, test layer compatibility

---

#### Step 14: Rewards CRUD (P2)

**Goal**: Implement rewards management with file upload integration.

**Output**: Rewards list and forms with image upload.

**Agent Assignment**: `general:sonnet` (medium complexity - combines CRUD + file upload)

**Dependencies**: 
- Step 9 (Users CRUD) - provides pattern
- Step 12 (File Upload) - MUST be complete

**Parallel With**: None - needs both dependencies

**Success Criteria**:
- [ ] Rewards CRUD operations functional
- [ ] Image upload works for reward creation
- [ ] Cache updates after mutations

**Subtasks**:
1. Create rewards page components following Users pattern
2. Integrate FileUpload component in reward forms
3. Implement GraphQL queries/mutations
4. Add image preview in reward cards

**Blockers**:
- Step 9 (Users CRUD) provides pattern
- Step 12 (File Upload) must be complete
- Resolution: File Upload is dependency

**Risks**: Medium - file upload integration

**Interface Consumed:**
- Import `{ FileUpload }` from `components/FileUpload.tsx` (Step 12)
- Copy pattern from `components/admin/users/*` (Step 9)

**Completion Signal:** Rewards CRUD with images works end-to-end

**LLM-as-Judge Verification:** Per-Task Evaluation
- Verification Level: Single-item per-task (1 evaluator)
- Threshold Score: 3.8/5.0
- Custom Rubric:
  - **Integration** (30%, weight 0.30): FileUpload component correctly integrated in reward forms, image preview displays after upload, URL saved to reward record
  - **Pattern Compliance** (25%, weight 0.25): Follows Users CRUD pattern exactly, directory structure matches, component names consistent
  - **Type Safety** (20%, weight 0.20): Reward types branded, mutations typed, FileUpload onUpload callback typed correctly
  - **UX** (15%, weight 0.15): Image upload progress visible, image preview in card, error handling for upload failures
  - **Cache Management** (10%, weight 0.10): Cache updates after create/edit with images, list shows updated images
- Evaluation Focus: File upload integration correctness, pattern adherence, image handling UX

---

#### Step 15: Challenges (P2)

**Goal**: Implement challenges with submissions, voting, and judging.

**Output**: Complete challenge management interface.

**Agent Assignment**: `general:opus` (HIGH complexity - most complex feature, judging UI, real-time)

**Dependencies**: 
- Step 13 (Validation & Admin Hooks) - MUST be complete
- Backend judging schema must be ready

**Parallel With**: None - most complex, sequential

**Success Criteria**:
- [ ] Challenges list with status
- [ ] Submissions view with approve/reject
- [ ] Voting interface for staff
- [ ] Judging interface with scoring
- [ ] Real-time updates via subscriptions

**Subtasks**:
1. Create challenges list page
2. Create challenge detail page
3. Implement submissions viewer
4. Add voting UI components
5. Create judging interface with Effect DI
6. Implement GraphQL subscriptions for real-time

**Blockers**:
- Step 13 (Validation & Admin Hooks) must be complete
- Backend judging schema must be ready
- Resolution: Verify judging endpoints

**Risks**:
- **HIGH**: Judging interface is most complex feature
- **HIGH**: Real-time subscription stability

**Mitigation**:
- Implement judging in isolation first
- Add comprehensive unit tests
- Test real-time features with load

**Interface Consumed:**
- Import `{ useJudgement }` from `hooks/admin/useJudgement.ts` (Step 13)
- Import `{ FileUpload }` from `components/FileUpload.tsx` (Step 12)

**Completion Signal:** Full challenge lifecycle works end-to-end

**LLM-as-Judge Verification:** Panel Evaluation
- Verification Level: Panel (3 independent evaluators)
- Threshold Score: 4.0/5.0
- Custom Rubric:
  - **Complexity Handling** (25%, weight 0.25): Judging logic calculates scores correctly, ranking system orders submissions properly, voting totals aggregate accurately
  - **Effect Usage** (25%, weight 0.25): Complex judging flows use Effect.gen with proper error handling, DI context accessed for judging operations, Either patterns used for error matching
  - **Real-time** (20%, weight 0.20): Subscriptions update UI immediately on new submissions/votes, WebSocket reconnection works, fallback polling when subscriptions fail
  - **UX** (15%, weight 0.15): Judging interface intuitive with clear scoring inputs, submission status visible (approved/rejected/pending), voting UI shows current votes
  - **Integration** (15%, weight 0.15): Backend judging endpoints integrated, useJudgement hook from Step 13 used correctly, challenge lifecycle state machine accurate
- Evaluation Focus: Judging calculation correctness (most complex feature), real-time subscription stability, Effect DI usage in judging, voting/judging UX clarity

---

#### Step 16: Coins (P3)

**Goal**: Implement coin management overview and operations.

**Output**: Coins dashboard and operation forms.

**Agent Assignment**: `general:haiku` (trivial complexity - simple CRUD following patterns)

**Dependencies**: 
- All P0-P1 steps complete (Users, Groups, Trip Context)

**Parallel With**: Step 17 (Notifications), Step 18 (Schedules) - runs in parallel wave

**Success Criteria**:
- [ ] Coin balances display for selected trip
- [ ] Transaction history visible
- [ ] Add/remove coin operations functional
- [ ] Operations log transactions

**Subtasks**:
1. Create `apps/web/src/components/admin/coins/CoinsOverviewPage.tsx`
2. Create `apps/web/src/components/admin/coins/CoinsPageContent.tsx`
3. Create `apps/web/src/components/admin/coins/CoinOperationForm.tsx`
4. Implement GraphQL queries for balances
5. Add transaction history view

**Blockers**:
- All P0-P1 steps complete
- Resolution: Sequential dependency

**Risks**: Low - straightforward CRUD

**Interface Consumed:**
- Copy pattern from `components/admin/users/*` (Step 9)
- Import `{ useTripContext }` from `contexts/TripContext.tsx` (Step 8)

**Completion Signal:** Coin operations work, history displays

**LLM-as-Judge Verification:** Per-Task Evaluation
- Verification Level: Single-item per-task (1 evaluator)
- Threshold Score: 3.5/5.0
- Custom Rubric:
  - **Pattern Compliance** (40%, weight 0.40): Follows established CRUD pattern from Users, directory structure correct (/admin/coins/), component names match convention
  - **Type Safety** (25%, weight 0.25): Coin types branded, operation inputs typed, transaction history typed
  - **Feature Correctness** (25%, weight 0.25): Add/remove coin operations work, transaction history displays with pagination, balance updates after operations
  - **Integration** (10%, weight 0.10): Trip context filters correctly, operations logged to transaction history
- Evaluation Focus: Pattern adherence, coin operation correctness, transaction history accuracy

---

#### Step 17: Notifications (P3)

**Goal**: Implement notification management with real-time delivery.

**Output**: Notifications page with subscription support.

**Agent Assignment**: `general:haiku` (trivial complexity - subscriptions pattern established)

**Dependencies**: 
- Step 3 (GraphQL Client subscriptions) - must be complete

**Parallel With**: Step 16 (Coins), Step 18 (Schedules) - runs in parallel wave

**Success Criteria**:
- [ ] Notifications list displays
- [ ] Create notification form
- [ ] Real-time delivery via subscriptions
- [ ] Target filtering (users/groups)

**Subtasks**:
1. Create `apps/web/src/components/admin/notifications/NotificationsPage.tsx`
2. Create `apps/web/src/components/admin/notifications/NotificationsPageContent.tsx`
3. Create `apps/web/src/components/admin/notifications/NotificationCard.tsx`
4. Create `apps/web/src/components/admin/notifications/CreateNotificationForm.tsx`
5. Implement GraphQL subscriptions
6. Add target user/group selection

**Blockers**:
- Step 3 (GraphQL Client subscriptions) must be complete
- Resolution: Subscription support required

**Risks**:
- **MEDIUM**: Real-time subscription handling

**Mitigation**:
- Test subscription reconnection
- Add polling fallback

**Interface Consumed:**
- Import GraphQL subscription hooks from generated client (Step 3)
- Copy pattern from `components/admin/users/*` (Step 9)

**Completion Signal:** Notifications send and receive in real-time

**LLM-as-Judge Verification:** Per-Task Evaluation
- Verification Level: Single-item per-task (1 evaluator)
- Threshold Score: 3.5/5.0
- Custom Rubric:
  - **Real-time** (35%, weight 0.35): GraphQL subscriptions receive notifications in real-time, subscription connection stable, new notifications appear immediately
  - **Pattern Compliance** (25%, weight 0.25): Follows Users CRUD pattern for list, component structure matches, forms follow convention
  - **Feature Correctness** (20%, weight 0.20): Target filtering (users/groups) works, create notification sends to correct recipients, notification history displays
  - **Integration** (15%, weight 0.15): Subscription hooks from Step 3 used correctly, target selection uses user/group data
  - **Type Safety** (5%, weight 0.05): Notification types branded, subscription payload typed
- Evaluation Focus: Real-time subscription functionality (critical for this step), target filtering correctness, pattern adherence

---

#### Step 18: Schedules & Activity (P3)

**Goal**: Implement schedule and activity management.

**Output**: Schedule view and activity CRUD.

**Agent Assignment**: `general:haiku` (trivial complexity - simple CRUD following patterns)

**Dependencies**: 
- All prior steps complete

**Parallel With**: Step 16 (Coins), Step 17 (Notifications) - runs in parallel wave

**Success Criteria**:
- [ ] Schedule displays in timeline/calendar view
- [ ] Activities ordered correctly
- [ ] Activity CRUD operations functional
- [ ] Changes reflect in schedule immediately

**Subtasks**:
1. Create schedule page with timeline view
2. Create activity list component
3. Implement activity CRUD forms
4. Add schedule reordering UI
5. Implement GraphQL operations

**Blockers**:
- All prior steps complete
- Resolution: Final feature

**Risks**: Low - follows established patterns

**Interface Consumed:**
- Copy pattern from `components/admin/users/*` (Step 9)
- Import `{ useTripContext }` from `contexts/TripContext.tsx` (Step 8)

**Completion Signal:** Schedule CRUD works, timeline displays correctly

**LLM-as-Judge Verification:** Per-Task Evaluation
- Verification Level: Single-item per-task (1 evaluator)
- Threshold Score: 3.5/5.0
- Custom Rubric:
  - **Pattern Compliance** (35%, weight 0.35): Follows Users CRUD pattern for activity management, component structure correct, forms follow convention
  - **Timeline UX** (25%, weight 0.25): Schedule displays in timeline/calendar view, activities ordered chronologically, visual distinction between activity types
  - **Feature Correctness** (25%, weight 0.25): Activity CRUD operations work, schedule reordering UI functional, changes reflect immediately
  - **Integration** (15%, weight 0.15): Trip context scopes schedule correctly, activities linked to trip
- Evaluation Focus: Timeline/calendar display UX, activity ordering correctness, pattern adherence, schedule reordering functionality

---

### Blockers and Resolutions Summary

| Blocker | Affected Steps | Resolution | Status |
|---------|---------------|------------|--------|
| Backend Better Auth endpoints | Step 2 | Verify with backend team before starting | PENDING |
| GraphQL schema stability | Step 3 | Coordinate schema freeze | PENDING |
| @mirai-app/ui exports | Step 4 | Verify package exports | PENDING |
| SeaweedFS Filer TUS endpoints | Step 12 | Verify backend file service | PENDING |
| Backend judging endpoints | Step 15 | Verify judging schema ready | PENDING |

### Risks and Mitigations Summary

| Risk | Priority | Affected Steps | Mitigation |
|------|----------|----------------|------------|
| Better Auth OTP complexity | HIGH | Step 2, Step 5 | Use Effect patterns, comprehensive error handling |
| GraphQL cache invalidation | HIGH | Step 3, Step 9, Step 10 | Document cache policies, test explicitly |
| Tamagui SSR compatibility | HIGH | Step 4 | Test SSR early, use CSS variables |
| SeaweedFS Filer TUS resume implementation | HIGH | Step 12 | Thorough testing, Effect orchestration |
| Judging Effect DI complexity | HIGH | Step 13, Step 15 | Pair with use-cases developer |
| Mobile navigation UX | MEDIUM | Step 7 | Test on real devices early |
| localStorage SSR sync | MEDIUM | Step 8 | Client:load directive, hydration-safe |
| Real-time subscription stability | MEDIUM | Step 3, Step 17 | Reconnection logic, polling fallback |
| Form state management | MEDIUM | Step 5, Step 9-11 | react-hook-form, optimistic UI |

### High-Risk Tasks Identified

1. **Step 2: Better Auth Integration** - Core dependency for all routes, complex OTP state machine
2. **Step 3: GraphQL Client Setup** - Affects all data fetching, cache behavior critical
3. **Step 4: Layout Shell** - Foundation component, SSR issues affect entire app
4. **Step 12: File Upload** - External service integration (SeaweedFS Filer native TUS), resume complexity
5. **Step 15: Challenges Judging** - Most complex UI, Effect DI integration

### Implementation Summary Table

| Step | Phase | Agent | Files | Est. Time | Dependencies | Risk Level | Parallel With |
|------|-------|-------|-------|-----------|--------------|------------|---------------|
| 1 | P0 | haiku | 4 | 4h | None | Low | N/A - triggers Wave 1 |
| 2 | P0 | **opus** | 5 | 8h | Step 1, Backend auth | HIGH | Step 3, 4, 6 |
| 3 | P0 | **opus** | 5 | 8h | Step 1, Backend GraphQL | HIGH | Step 2, 4, 6 |
| 4 | P0 | **opus** | 5 | 6h | Step 1, UI package | HIGH | Step 2, 3, 6 |
| 5 | P0 | sonnet | 5 | 6h | Step 2 | Medium | Step 7, 8 |
| 6 | P0-P1 | haiku | 8 | 6h | UI package | Low | Step 2, 3, 4 |
| 7 | P1 | sonnet | 4 | 6h | Step 4 | Medium | Step 5, 8 |
| 8 | P1 | sonnet | 4 | 6h | Step 3, Step 6 | Medium | Step 5, 7 |
| 9 | P1 | sonnet | 10 | 12h | Step 3, 6, 8 | Medium | Step 11 (50%) |
| 10 | P1 | haiku | 5 | 8h | Step 9 pattern | Low | Step 12 |
| 11 | P4 | haiku | 1 | 4h | Step 9 (50%) | Low | Step 9, 10 |
| 12 | P4 | **opus** | 3 | 10h | External file service | HIGH | Step 10 |
| 13 | P4 | sonnet | 3 | 8h | Step 9 | HIGH | Step 10 |
| 14 | P2 | sonnet | 5 | 6h | Step 9, 12 | Medium | None |
| 15 | P2 | **opus** | 6 | 16h | Step 13, Backend judging | HIGH | None |
| 16 | P3 | haiku | 3 | 6h | All P0-P1 | Low | Step 17, 18 |
| 17 | P3 | haiku | 4 | 8h | Step 3 subscriptions | Medium | Step 16, 18 |
| 18 | P3 | haiku | 4 | 8h | All prior | Low | Step 16, 17 |

**Total**: 18 steps | 74 files | ~120 hours | 5 high-risk steps
**Agent Distribution**:
- **opus** (complex): 5 steps (2, 3, 4, 12, 15) = 48 hours
- **sonnet** (medium): 6 steps (5, 7, 8, 9, 13, 14) = 44 hours
- **haiku** (trivial): 7 steps (1, 6, 10, 11, 16, 17, 18) = 34 hours

**Parallelization Summary**:
- **Maximum parallel depth**: 4 agents (Wave 1: Steps 2, 3, 4, 6)
- **Wave count**: 6 waves total
- **Theoretical speedup**: ~42% (120h → ~70h)
- **Critical path**: 1 → [2|3|4|6] → [5|7|8] → 9 → 10 → 13 → 15 → [16|17|18]

### LLM-as-Judge Verification Summary

| Step | Phase | Agent | Risk Level | Verification Level | Evaluators | Threshold | Weighted Criteria Focus |
|------|-------|-------|------------|-------------------|------------|-----------|------------------------|
| 1 | P0 | haiku | Low | None | 0 | N/A | Build system validation |
| 2 | P0 | opus | **HIGH** | **Panel** | 3 | 4.0/5.0 | Security 30%, Correctness 25%, Type Safety 20% |
| 3 | P0 | opus | **HIGH** | **Panel** | 3 | 4.0/5.0 | Type Safety 30%, Caching 25%, Integration 20% |
| 4 | P0 | opus | **HIGH** | **Panel** | 3 | 4.0/5.0 | SSR Compatibility 30%, UX 25%, Integration 20% |
| 5 | P0 | sonnet | Medium | Per-Task | 1 | 3.8/5.0 | Form Correctness 30%, Auth Integration 25%, UX 25% |
| 6 | P0-P1 | haiku | Low | Per-Item (spot-check: Button, Input, Card) | 3 | 3.5/5.0 | Prop Pass-through 40%, Type Safety 30%, Consistency 20% |
| 7 | P1 | sonnet | Medium | Per-Task | 1 | 3.8/5.0 | UX 30%, Responsive 25%, Integration 20%, Accessibility 20% |
| 8 | P1 | sonnet | Medium | **Panel** | 3 | 3.8/5.0 | Type Safety 30%, SSR Safety 25%, Integration 25% |
| 9 | P1 | sonnet | Medium | **Panel** | 3 | 3.8/5.0 | Pattern Establishment 30%, Type Safety 25%, Cache Management 20% |
| 10 | P1 | haiku | Low | Per-Task | 1 | 3.5/5.0 | Pattern Compliance 40%, Type Safety 25%, Feature Parity 25% |
| 11 | P4 | haiku | Low | Per-Task | 1 | 3.5/5.0 | Type Safety 35%, Correctness 30%, API Design 20% |
| 12 | P4 | opus | **HIGH** | **Panel** | 3 | 4.0/5.0 | Integration 30%, State Management 25%, UX 20%, Error Handling 15% |
| 13 | P4 | sonnet | **HIGH** | **Panel** | 3 | 3.8/5.0 | Correctness 30%, Effect Integration 30%, Type Safety 20% |
| 14 | P2 | sonnet | Medium | Per-Task | 1 | 3.8/5.0 | Integration 30%, Pattern Compliance 25%, Type Safety 20% |
| 15 | P2 | opus | **HIGH** | **Panel** | 3 | 4.0/5.0 | Complexity Handling 25%, Effect Usage 25%, Real-time 20%, UX 15% |
| 16 | P3 | haiku | Low | Per-Task | 1 | 3.5/5.0 | Pattern Compliance 40%, Type Safety 25%, Feature Correctness 25% |
| 17 | P3 | haiku | Low-Medium | Per-Task | 1 | 3.5/5.0 | Real-time 35%, Pattern Compliance 25%, Feature Correctness 20% |
| 18 | P3 | haiku | Low | Per-Task | 1 | 3.5/5.0 | Pattern Compliance 35%, Timeline UX 25%, Feature Correctness 25% |

**Verification Totals**:
| Verification Type | Steps | Evaluators per Step | Total Evaluations |
|-------------------|-------|---------------------|-------------------|
| Panel (3 evaluators) | 2, 3, 4, 8, 9, 12, 13, 15 | 3 | 24 |
| Per-Task (1 evaluator) | 5, 7, 10, 11, 14, 16, 17, 18 | 1 | 8 |
| Per-Item spot-check | 6 | 3 | 3 |
| None | 1 | 0 | 0 |
| **TOTAL** | | | **35** |

**Verification by Wave**:
- **Wave 1 (Foundation)**: 14 evaluations (Panel: 2,3,4; Per-Task: 5; Per-Item: 6; None: 1)
- **Wave 2 (Navigation)**: 7 evaluations (Panel: 8; Per-Task: 7)
- **Wave 3 (Core CRUD)**: 8 evaluations (Panel: 9; Per-Task: 10, 11)
- **Wave 4 (Shared Components)**: 7 evaluations (Panel: 12, 13)
- **Wave 5 (Features)**: 4 evaluations (Panel: 15; Per-Task: 14)
- **Wave 6 (Operations)**: 3 evaluations (Per-Task: 16, 17, 18)

### Definition of Done

- [x] All 29 acceptance criteria pass
- [x] Feature parity verified against pjapp-main (all 30+ pages functional)
- [x] Unit tests for components with mocked urql hooks
- [ ] Integration tests for full page flows
- [ ] E2E tests for critical paths (login → dashboard → CRUD)
- [x] No console errors in production build
- [x] Mobile-responsive verified on iOS Safari and Chrome Mobile
- [x] Performance audit: all pages load within 3 seconds
- [x] Code review completed
- [x] Documentation updated (inline code comments)
