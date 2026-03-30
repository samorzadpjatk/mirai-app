## Context

The Mirai monorepo currently contains a React Native mobile app (`apps/native`) with an embedded admin panel at `apps/native/src/app/(tabs)/admin/`. The admin panel includes comprehensive management features for users, groups, challenges, rewards, notifications, schedules, transactions, coins, and activities. The monorepo uses Turborepo with shared packages (`@mirai-app/auth`, `@mirai-app/trpc`, `@mirai-app/db`, `@mirai-app/supabase`, `@mirai-app/shared`) that are consumed by multiple apps.

**Current Limitations:**

- Admin features embedded in mobile app limit accessibility to staff with mobile devices
- React Native's mobile-first UX is suboptimal for data-heavy admin tasks
- Large admin codebase increases mobile app bundle size unnecessarily
- Deployment cycles tied to mobile app releases

**Stakeholders:**

- Admin users requiring desktop-friendly management interface
- Mobile app users benefiting from reduced bundle size
- DevOps team managing deployment pipelines

## Goals / Non-Goals

**Goals:**

- Create standalone Astro web application for admin panel at `apps/admin-web`
- Maximize code reuse from existing shared packages (`@mirai-app/auth`, `@mirai-app/trpc`, etc.)
- Maintain feature parity with existing admin functionality during migration
- Reduce React Native app bundle size by removing admin code
- Enable independent deployment of admin web application
- Preserve existing backend APIs and database schema (zero backend changes)

**Non-Goals:**

- Redesigning admin UX or adding new features (pure migration)
- Modifying backend tRPC routers or database schema
- Creating new authentication system (reuse `@mirai-app/auth`)
- Supporting mobile-responsive admin interface initially (desktop-first)
- Migrating non-admin parts of React Native app

## Decisions

### Decision 1: Astro as Framework

**Choice:** Use Astro with React islands for admin web application

**Rationale:**

- **Server-first architecture** reduces client-side JavaScript for admin dashboard pages
- **React integration** allows reusing React components from shared packages and migrated admin components
- **TypeScript support** maintains type safety across monorepo
- **File-based routing** simplifies migration from React Native screens to web pages
- **Build performance** with partial hydration optimizes admin panel load times

**Alternatives considered:**

- Next.js: Heavier runtime, more complex server/client boundary, larger bundle size
- Remix: Similar benefits but less mature ecosystem for islands architecture
- Plain React SPA: No server-side rendering, worse initial load performance

### Decision 2: Component Migration Strategy

**Choice:** Copy and adapt React Native components to web with Tailwind CSS custom component library

**Approach:**

- **Copy admin hooks directly** from `apps/native/src/hooks/admin/` to `apps/admin-web/src/hooks/admin/`
  - Hooks are 90% web-compatible (React Query + tRPC)
  - Only adapt UI dependencies (Alert → toast, ImagePicker → file input)
  - Business logic, validation, state management remain identical
- **Replace React Native primitives** with semantic HTML (`View` → `div`, `Text` → `span`/`p`, `TouchableOpacity` → `button`)
- **Use Tailwind CSS** for styling (matches utility-first approach of React Native StyleSheet)
- **Use react-hot-toast** for toast notifications (replaces React Native `Alert.alert()`)
- **Build custom component library** mirroring React Native structure:
  - `components/ui/Button.tsx` (variants: primary, secondary, ghost)
  - `components/ui/Card.tsx`
  - `components/ui/Input.tsx`
  - `components/ui/Modal.tsx`
  - Similar patterns to React Native components for consistency
- **Replace React Native navigation** with Astro routing + React client-side state
- **Maintain file organization** for easier comparison during migration
- **Implement all features**: Migrate all admin functionality including complex forms, image uploads, challenge submissions, voting, and judgment

**Rationale:**

- **Hook reusability**: No shared package needed since React Native admin will be removed (no dual maintenance)
- **Same interactions**: Copying hooks preserves proven business logic and UX patterns
- **Tailwind CSS**: Faster development, easier to match mobile styling patterns, utility-first like StyleSheet
- **Custom components**: Maintains design consistency, easier to adapt from React Native components
- **Full feature parity**: Implement all admin features including complex forms, image uploads, submissions, voting, and judgment
- **No premature optimization**: Since RN admin will be deleted, no need for shared abstractions

**Alternatives considered:**

- Shared `@mirai-app/admin-hooks` package: Unnecessary complexity since only web will exist
- Component library (shadcn/ui, Radix): Would require adapting to existing patterns, custom gives more control
- React Native Web: Adds complexity, larger bundle, doesn't solve UX issues

### Decision 3: Shared Package Integration

**Choice:** Reuse existing packages with minimal adaptation

**Packages:**

- `@mirai-app/auth`: Authentication state management and Supabase client integration
- `@mirai-app/trpc`: tRPC client configuration and React Query integration
- `@mirai-app/db`: Database types and schema
- `@mirai-app/supabase`: Supabase client utilities
- `@mirai-app/shared`: Shared types and utilities

**Adaptation Required:**

- Update `@mirai-app/trpc` exports to support web environment (currently has `/client/expo` export)
- Ensure `@mirai-app/auth` works in browser context (verify no Expo-specific dependencies)
- Configure module resolution in Astro to handle workspace packages
- Replace React Native `Alert.alert()` with react-hot-toast in all admin hooks and components

**react-hot-toast Integration Pattern:**

```typescript
// Before (React Native):
Alert.alert("Success", "User created successfully");
Alert.alert("Error", "Failed to create user");

// After (Web with react-hot-toast):
import { toast } from "react-hot-toast";
toast.success("User created successfully");
toast.error("Failed to create user");
toast.loading("Creating user...");
```

**Rationale:**

- Avoids code duplication and maintains single source of truth
- Leverages existing battle-tested authentication and data fetching logic
- Ensures admin web app stays in sync with backend API changes

### Decision 4: Routing Structure

**Choice:** Mirror existing React Native admin routes in Astro pages directory

**Mapping:**

```
apps/native/src/app/(tabs)/admin/
├── index.tsx                  → apps/admin-web/src/pages/index.astro
├── users/index.tsx            → apps/admin-web/src/pages/users/index.astro
├── users/new.tsx              → apps/admin-web/src/pages/users/new.astro
├── users/edit/[userId].tsx    → apps/admin-web/src/pages/users/edit/[userId].astro
├── groups/index.tsx           → apps/admin-web/src/pages/groups/index.astro
├── challenges/index.tsx       → apps/admin-web/src/pages/challenges/index.astro
├── rewards/index.tsx          → apps/admin-web/src/pages/rewards/index.astro
├── notifications/index.tsx    → apps/admin-web/src/pages/notifications/index.astro
├── schedules/index.tsx        → apps/admin-web/src/pages/schedules/index.astro
├── transactions/index.tsx     → apps/admin-web/src/pages/transactions/index.astro
├── coins/index.tsx            → apps/admin-web/src/pages/coins/index.astro
├── activity/index.tsx         → apps/admin-web/src/pages/activity/index.astro
```

**Rationale:**

- Maintains familiar structure for developers
- Simplifies testing (can compare behavior 1:1)
- Astro's file-based routing naturally maps to existing structure

### Decision 5: Authentication Flow

**Choice:** Implement web-based authentication using `@mirai-app/auth` with Supabase OTP numeric code verification

**Implementation:**

- Use Supabase Auth OTP with 6-digit numeric codes sent via email (matching mobile app)
- Send OTP code using `signInWithOtp` from `@mirai-app/auth` package
- Display OTP input field after email submission for user to enter received code
- Verify code using Supabase `verifyOtp` method
- Handle invalid/expired codes with appropriate error messages
- Check authentication status on page load (Astro middleware or layout)
- Redirect unauthenticated users to login page
- Store session in browser cookies/localStorage (Supabase handles this)
- Verify admin role using existing tRPC procedures

**Rationale:**

- Reuses existing authentication infrastructure
- Maintains consistent UX between mobile and web (same OTP flow)
- No backend changes required
- More secure than magic links (codes expire quickly, no clickable links)
- Consistent auth behavior across mobile and web

### Decision 6: tRPC Client Configuration

**Choice:** Configure tRPC client for web environment with Astro-specific setup

**Implementation:**

- Create new tRPC client initialization in `apps/admin-web/src/lib/trpc.ts`
- Use `@mirai-app/trpc` package with web-compatible exports
- Configure React Query provider in Astro layout for client components
- Use HTTP transport instead of Expo-specific transport
- Point to same backend server URL used by mobile app

**Rationale:**

- Maintains API compatibility with backend
- Leverages existing tRPC router definitions
- React Query integration provides caching and optimistic updates

### Decision 7: File Upload and Storage

**Choice:** Use Supabase Storage with web-native file upload, matching React Native pattern

**Implementation:**

- **Reuse Supabase Storage buckets** (same buckets as mobile app)
- **Web file upload flow**:

  ```typescript
  // HTML: <input type="file" accept="image/*" onChange={handleFileChange} />

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const storagePath = `challenge/${tripId}/cover-${Date.now()}.${ext}`;

    // Upload directly to Supabase Storage
    const { data, error } = await supabase.storage
      .from("bucket-name")
      .upload(storagePath, file, { upsert: true });
  };
  ```

- **Progress tracking**: Use native `XMLHttpRequest` or fetch with progress callback
- **Image preview**: Use `URL.createObjectURL()` for local preview before upload
- **Storage paths**: Keep identical naming convention to mobile app
- **Content types**: Same MIME type handling as React Native

**Rationale:**

- **Same storage infrastructure**: No backend changes, same buckets, same URLs
- **Simpler than mobile**: No Expo ImagePicker, just native file input
- **Direct upload**: Same pattern as RN (client → Supabase Storage, not via backend)
- **Consistent URLs**: Public URLs work identically across platforms

**Alternatives considered:**

- Upload through backend: Adds unnecessary latency, backend doesn't need to proxy files
- Different storage provider: Would require backend changes (against non-goals)

### Decision 8: Monorepo Integration

**Choice:** Add `apps/admin-web` to Turborepo configuration

**Changes:**

- Add `apps/admin-web` to `package.json` workspaces
- Add build/dev tasks to `turbo.json`
- Create npm script `dev:admin-web` in root `package.json`
- Configure TypeScript to extend `tsconfig.base.json`

**Rationale:**

- Consistent with existing monorepo patterns
- Enables parallel builds and caching via Turborepo
- Simplifies local development workflow

## Risks / Trade-offs

### Risk 1: Package Compatibility

**Risk:** Shared packages may have React Native-specific dependencies that break in web environment

**Mitigation:**

- Audit package dependencies during setup phase
- Create web-compatible exports if needed (e.g., `@mirai-app/auth/web`)
- Test package imports early in development
- Document any necessary package modifications

### Risk 2: Component Migration Errors

**Risk:** Subtle behavioral differences between React Native and web components may introduce bugs

**Mitigation:**

- Migrate one admin section at a time (e.g., users, then groups)
- Manual testing of each migrated feature against documented RN behavior
- Test admin hooks in isolation first (pure data operations)
- UI components second (form interactions, modals, navigation)
- Document any intentional UX changes during migration

### Risk 3: Authentication Session Management

**Risk:** Different session handling between mobile and web could cause security issues

**Mitigation:**

- Use Supabase's built-in web session management
- Test session persistence, expiration, and refresh flows
- Verify admin role checks work identically on web
- Review auth middleware for web-specific edge cases

### Risk 4: Performance Degradation

**Risk:** Web admin panel may be slower than mobile app for data-heavy operations

**Mitigation:**

- Leverage Astro's SSR for initial page loads
- Use React Query caching aggressively
- Implement pagination for large data sets
- Monitor performance metrics during migration

### Risk 5: Deployment Complexity

**Risk:** New web app requires separate deployment pipeline and infrastructure

**Mitigation:**

- Host on separate domain (e.g., admin.mirai-app.com) for isolation and security
- Document deployment setup in README
- Create Docker configuration similar to existing apps
- Set up CI/CD pipeline early in development
- Consider static hosting (Vercel, Netlify) if compatible with SSR needs, or containerized deployment

### Trade-off 1: Development Time vs. Feature Parity

**Trade-off:** Maintaining exact feature parity increases migration time

**Accepted Approach:** Migrate all features completely including complex functionality (challenge forms with image uploads, submission review, staff voting, judgment interface) to ensure full feature parity from day one

### Trade-off 2: Bundle Size vs. Code Reuse

**Trade-off:** Reusing packages may include unused dependencies in web bundle

**Accepted Approach:** Prioritize code reuse initially, optimize bundle size post-migration with tree-shaking and code splitting

## Migration Plan

### Phase 1: Setup (Week 1)

1. Create `apps/admin-web` directory with Astro initialization
2. Configure TypeScript, ESLint, and Prettier
3. Add to Turborepo and root package.json scripts
4. Set up shared package imports and verify compatibility
5. Implement basic authentication flow and layout

### Phase 2: Core Infrastructure (Week 1-2)

1. Configure tRPC client for web
2. Create admin layout with navigation matching mobile app
3. Implement authentication middleware
4. Set up Tailwind CSS with custom configuration
5. Create reusable component library (Button, Card, Input, Modal) mirroring React Native patterns
6. Implement web file upload utility for Supabase Storage

### Phase 3: Page Migration (Week 2-4)

Migrate admin sections incrementally (simple → complex):

1. Dashboard (index page with stats)
2. Users management (list, create, edit) - **Start here: simpler CRUD**
3. Groups management - **Simple CRUD with relationships**
4. Transactions view - **Read-only, good for testing data display**
5. Schedules management - **Date/time pickers**
6. Notifications management - **Forms with target selection**
7. Coins management - **Simple operations**
8. Activities management - **Basic CRUD**
9. Rewards management - **Introduces image uploads**
10. Challenges management - **Most complex: implement fully**
    - Basic challenge CRUD
    - Challenge form with all fields (`useChallengeForm` adaptation)
    - Image uploads for challenge covers
    - Submissions review interface
    - Staff voting interface
    - Judgment interface with scoring
    - All challenge-related workflows

### Phase 4: Testing & Validation (Week 4-5)

1. Manual testing of all migrated features
2. Compare behavior with documented RN admin functionality
3. Test OTP authentication flow end-to-end
4. Test file uploads to Supabase Storage
5. Load testing for performance validation
6. Security review of authentication flow
7. Address bugs and UX issues

### Phase 5: Deployment & Cleanup (Week 5-6)

1. Set up production deployment pipeline
2. Deploy to staging environment for final testing
3. Deploy to production
4. Remove admin code from React Native app
5. Update documentation

### Rollback Strategy

If critical issues are discovered post-deployment:

1. Maintain ability to redeploy previous web app version quickly
2. Monitor error rates and user feedback closely during first week
3. Keep documentation of RN admin functionality for reference
4. Have backup plan to extend RN admin access temporarily if needed (though goal is full removal)

## Open Questions

1. **Access Control:** Should admin web app have IP whitelist or additional security? (Recommend: Review during security audit)
