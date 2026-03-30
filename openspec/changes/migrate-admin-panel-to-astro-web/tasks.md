## 1. Project Setup and Configuration

- [x] 1.1 Initialize Astro project at `apps/admin-web` with TypeScript template
- [x] 1.2 Configure `tsconfig.json` to extend `../../tsconfig.base.json`
- [x] 1.3 Add `apps/admin-web` to root `package.json` workspaces array
- [x] 1.4 Add admin-web build, dev, lint, and typecheck tasks to `turbo.json`
- [x] 1.5 Add `dev:admin-web` script to root `package.json`
- [x] 1.6 Install Astro React integration: `@astrojs/react`
- [x] 1.7 Configure `astro.config.mjs` with React integration and server/hybrid output mode
- [x] 1.8 Add shared package dependencies: `@mirai-app/auth`, `@mirai-app/trpc`, `@mirai-app/db`, `@mirai-app/supabase`, `@mirai-app/shared` as workspace dependencies
- [x] 1.9 Install web-specific dependencies: `react`, `react-dom`, `@tanstack/react-query`
- [x] 1.10 Create base directory structure: `src/pages/`, `src/components/`, `src/layouts/`, `src/lib/`, `src/hooks/`
- [x] 1.11 Install and configure Tailwind CSS with Astro integration
- [x] 1.12 Create Tailwind config extending base theme for custom design tokens
- [x] 1.13 Create `.env` file with Supabase credentials for development
- [x] 1.14 Verify `bun run dev` starts development server successfully
- [x] 1.15 Verify `bun run build` completes without errors

## 2. Authentication Infrastructure

- [x] 2.1 Create `src/lib/auth.ts` to initialize auth using `@mirai-app/auth` package
- [x] 2.2 Verify `@mirai-app/auth` package works in browser environment (no React Native dependencies)
- [x] 2.3 Create Supabase client initialization in `src/lib/supabase.ts` for web
- [x] 2.4 Create `src/pages/login.astro` page with OTP login form
- [x] 2.5 Create `src/components/LoginForm.tsx` React component using `useLoginForm` hook from `@mirai-app/auth`
- [x] 2.6 Implement OTP email sending flow using existing `signInWithOtp` method (6-digit numeric code)
- [x] 2.7 Create OTP code input component for users to enter received 6-digit code
- [x] 2.8 Implement OTP code verification using Supabase Auth `verifyOtp` method
- [x] 2.9 Handle OTP verification errors (invalid code, expired code)
- [x] 2.10 Test OTP email delivery and code verification flow end-to-end
- [x] 2.11 Implement session persistence in browser localStorage/cookies via Supabase
- [x] 2.12 Create authentication middleware (`src/middleware.ts`) to protect admin routes
- [x] 2.13 Implement redirect to login page for unauthenticated users
- [x] 2.14 Verify authenticated users can access protected routes
- [x] 2.15 Implement admin role verification using tRPC procedure
- [x] 2.16 Create logout functionality that clears session and redirects to login
- [x] 2.17 Implement automatic token refresh before expiration
- [x] 2.18 Test session expiration and redirect to login

## 3. tRPC Client Configuration

- [x] 3.1 Create `src/lib/trpc.ts` for tRPC client initialization
- [x] 3.2 Configure tRPC client with HTTP transport (not Expo-specific transport)
- [x] 3.3 Set backend server URL from environment variable
- [x] 3.4 Create React Query client configuration
- [x] 3.5 Create `src/components/TRPCProvider.tsx` wrapper component
- [x] 3.6 Integrate TRPCProvider in main layout for client components
- [x] 3.7 Configure authentication headers to include Supabase access token
- [x] 3.8 Test tRPC query procedure call from client component
- [x] 3.9 Test tRPC mutation procedure call from client component
- [x] 3.10 Verify TypeScript type inference works for tRPC calls
- [x] 3.11 Implement error handling with user-friendly messages
- [x] 3.12 Test network error handling with retry logic
- [x] 3.13 Configure optimistic updates for mutation procedures
- [x] 3.14 Verify tRPC works correctly in Astro islands architecture

## 4. Base Layout and Navigation

- [x] 4.1 Create `src/layouts/Layout.astro` with HTML boilerplate and meta tags
- [x] 4.2 Create `src/layouts/AdminLayout.astro` for authenticated admin pages
- [x] 4.3 Add global CSS styles and fonts
- [x] 4.4 Create navigation component with links to all admin sections
- [x] 4.5 Create header component with logout button
- [x] 4.6 Style navigation to match or improve mobile app navigation
- [x] 4.7 Implement active route highlighting in navigation
- [x] 4.8 Test navigation between different admin sections

## 5. Reusable Component Library (Custom with Tailwind CSS)

- [x] 5.1 Create `src/components/ui/Button.tsx` with variants (primary, secondary, ghost, danger)
- [x] 5.2 Add Tailwind utility classes for button states (hover, active, disabled)
- [x] 5.3 Create `src/components/ui/Input.tsx` for text inputs with label and error states
- [x] 5.4 Create `src/components/ui/DateInput.tsx` wrapper around native `input[type="date"]`
- [x] 5.5 Create `src/components/ui/TimeInput.tsx` wrapper around native `input[type="time"]`
- [x] 5.6 Create `src/components/ui/Select.tsx` for dropdowns
- [x] 5.7 Create `src/components/ui/Modal.tsx` for dialog modals with backdrop
- [x] 5.8 Create `src/components/ui/Card.tsx` for content cards
- [x] 5.9 Create `src/components/ui/LoadingSpinner.tsx`
- [x] 5.10 Create `src/components/ui/ErrorMessage.tsx`
- [x] 5.11 Install react-hot-toast: `bun add react-hot-toast`
- [x] 5.12 Configure react-hot-toast Toaster component in main layout
- [x] 5.13 Create toast wrapper utility in `src/lib/toast.ts` for consistent API (success, error, info)
- [x] 5.14 Test all base components render correctly with Tailwind styles
- [x] 5.15 Test toast notifications display correctly

## 6. Dashboard Page

- [x] 6.1 Create `src/pages/index.astro` for admin dashboard
- [x] 6.2 Create `src/components/admin/AdminStats.tsx` component (migrate from RN)
- [x] 6.3 Create `src/components/admin/AdminTile.tsx` navigation tiles (migrate from RN)
- [x] 6.4 Fetch and display statistics using tRPC queries
- [x] 6.5 Implement navigation tiles for all admin sections
- [x] 6.6 Style dashboard to be desktop-friendly
- [x] 6.7 Test dashboard loads with correct data

## 7. Users Management Pages

- [x] 7.1 Create `src/pages/users/index.astro` for user list
- [x] 7.2 Copy `useAdminUsers` hook from RN to `src/hooks/admin/useAdminUsers.ts` (no changes needed - pure tRPC/React Query)
- [x] 7.3 Create `src/components/admin/users/UserCard.tsx` (copy from RN, replace View/Text with div/span, apply Tailwind)
- [x] 7.4 Implement user list with pagination and search
- [x] 7.5 Create `src/pages/users/new.astro` for creating users
- [x] 7.6 Create `src/components/admin/users/CreateUserForm.tsx` (adapt from RN CreateUserModal, remove modal wrapper)
- [x] 7.7 Implement user creation form with validation
- [x] 7.8 Replace Alert.alert() with react-hot-toast (toast.success, toast.error)
- [x] 7.9 Create `src/pages/users/edit/[userId].astro` for editing users
- [x] 7.10 Create `src/components/admin/users/EditUserForm.tsx` (adapt from RN EditUserModal)
- [x] 7.11 Implement user editing form with pre-filled data
- [ ] 7.12 Test user CRUD operations end-to-end

## 8. Groups Management Pages

- [x] 8.1 Create `src/pages/groups/index.astro` for group list
- [x] 8.2 Copy `useAdminGroups` hook (no changes needed - pure tRPC/React Query)
- [x] 8.3 Create `src/components/admin/groups/GroupCard.tsx` (copy from RN, apply Tailwind)
- [x] 8.4 Implement group list with search functionality
- [x] 8.5 Create `src/pages/groups/new.astro` for creating groups
- [x] 8.6 Create group creation form (adapt from RN GroupModals)
- [x] 8.7 Create `src/pages/groups/edit/[groupId].astro` for editing groups
- [x] 8.8 Implement group assignment modal/component for adding members
- [x] 8.9 Replace RN Alert with react-hot-toast notifications
- [x] 8.10 Test group CRUD operations

## 9. File Upload Infrastructure (for Rewards/Challenges)

- [x] 9.1 Create `src/hooks/useWebFileUpload.ts` for Supabase Storage uploads
- [x] 9.2 Implement file selection using HTML `<input type="file">`
- [x] 9.3 Add image preview using `URL.createObjectURL()`
- [x] 9.4 Implement upload progress tracking
- [x] 9.5 Add error handling for upload failures
- [x] 9.6 Create helper utilities for file validation (size, type)
- [ ] 9.7 Test file upload to Supabase Storage bucket
- [ ] 9.8 Verify uploaded files accessible via public URL

## 10. Challenges Management Pages (Full Implementation)

### 10.A Basic Challenge CRUD

- [x] 10.1 Create `src/pages/challenges/index.astro` for challenge list
- [x] 10.2 Copy `useAdminChallenges` hook (minimal changes - pure tRPC/React Query)
- [x] 10.3 Create `src/components/admin/challenges/ChallengeCard.tsx` (copy from RN, apply Tailwind)
- [x] 10.4 Implement challenge list with status filters (draft, active, voting, judging, completed)
- [x] 10.5 Add search and sorting functionality for challenges

### 10.B Challenge Creation Form (Full Features)

- [x] 10.6 Create `src/pages/challenges/new.astro` for creating challenges
- [x] 10.7 Copy and adapt `useChallengeForm` hook from RN to `src/hooks/admin/useChallengeForm.ts`
- [x] 10.8 Replace `Alert.alert()` with react-hot-toast (toast.success, toast.error, toast.loading)
- [x] 10.9 Replace `expo-image-picker` with web file input for cover image
- [x] 10.10 Create `src/components/admin/challenges/ChallengeForm.tsx` with all fields:
  - [ ] Title, description, and instructions
  - [ ] Cover image upload with preview
  - [ ] Points/rewards configuration
  - [ ] Challenge type selection (photo, video, text, etc.)
  - [ ] Start and end dates
  - [ ] Voting settings (peer voting enabled, vote weight)
  - [ ] Judgment settings (staff judging enabled, scoring criteria)
  - [ ] Trip association
  - [ ] Group/participant restrictions
- [x] 10.11 Implement image upload for challenge cover using `useWebFileUpload`
- [x] 10.12 Add validation for all form fields
- [ ] 10.13 Test challenge creation with image upload

### 10.C Challenge Editing

- [x] 10.14 Create `src/pages/challenges/edit/[id].astro` for editing challenges
- [x] 10.15 Reuse `ChallengeForm` component with edit mode
- [x] 10.16 Pre-populate form with existing challenge data
- [x] 10.17 Handle cover image replacement
- [ ] 10.18 Test challenge editing workflow

### 10.D Challenge Details and Management

- [x] 10.19 Create `src/pages/challenges/[id].astro` for challenge details
- [x] 10.20 Display full challenge information
- [x] 10.21 Show challenge status and timeline
- [x] 10.22 Add action buttons (start voting, start judging, complete, delete)
- [x] 10.23 Implement challenge state transitions

### 10.E Submissions Review Interface

- [x] 10.24 Create `src/pages/challenges/[id]/submissions.astro` for submission review
- [x] 10.25 Copy submission-related hooks from RN
- [x] 10.26 Create `src/components/admin/challenges/SubmissionCard.tsx`
- [x] 10.27 Display all submissions with user info, timestamp, and content
- [x] 10.28 Implement submission image/video viewing (modal or lightbox)
- [x] 10.29 Add submission filtering (by status, user, score)
- [x] 10.30 Implement submission moderation actions (approve, reject, flag)
- [ ] 10.31 Test submission review workflow

### 10.F Staff Voting Interface

- [x] 10.32 Create `src/pages/challenges/[id]/voting.astro` for staff voting
- [x] 10.33 Copy voting-related hooks from RN
- [x] 10.34 Create `src/components/admin/challenges/VotingCard.tsx`
- [x] 10.35 Display submissions in voting format
- [x] 10.36 Implement voting controls (upvote, downvote, or rating scale)
- [x] 10.37 Show current vote tallies and rankings
- [x] 10.38 Prevent duplicate voting by same staff member
- [x] 10.39 Add voting period countdown/timer
- [ ] 10.40 Test staff voting workflow

### 10.G Judgment Interface

- [x] 10.41 Create `src/pages/challenges/[id]/judging.astro` for judgment
- [x] 10.42 Copy judgment-related hooks from RN
- [x] 10.43 Create `src/components/admin/challenges/JudgmentForm.tsx`
- [x] 10.44 Display submissions with voting results
- [x] 10.45 Implement scoring interface with criteria-based evaluation
- [x] 10.46 Add notes/feedback for each submission
- [x] 10.47 Implement final ranking assignment
- [x] 10.48 Show winner selection and point distribution
- [x] 10.49 Add "complete challenge" action that finalizes results
- [ ] 10.50 Test judgment workflow end-to-end

### 10.H Challenge Analytics (if available in RN)

- [x] 10.51 Add participation statistics (submissions count, participation rate)
- [x] 10.52 Display voting analytics (votes per submission, voter participation)
- [x] 10.53 Show completion timeline and milestones
- [ ] 10.54 Test analytics display

## 11. Rewards Management Pages

- [x] 11.1 Create `src/pages/rewards/index.astro` for reward list
- [x] 11.2 Copy reward-related hooks
- [x] 11.3 Create reward card component with Tailwind styling
- [x] 11.4 Create `src/pages/rewards/new.astro` for creating rewards
- [x] 11.5 Create reward creation form
- [x] 11.6 Implement image upload for reward images using `useWebFileUpload`
- [x] 11.7 Add image preview before upload
- [x] 11.8 Create `src/pages/rewards/edit/[rewardId].astro` for editing rewards
- [x] 11.9 Implement reward edit form with existing image display
- [ ] 11.10 Test reward CRUD operations with image uploads

## 12. Notifications Management Pages

- [x] 12.1 Create `src/pages/notifications/index.astro` for notification list
- [x] 12.2 Copy `useAdminNotifications` hook
- [x] 12.3 Create `src/components/admin/notifications/NotificationCard.tsx`
- [x] 12.4 Implement notification list with filters
- [x] 12.5 Create `src/pages/notifications/new.astro` for creating notifications
- [x] 12.6 Create notification creation form with target user selection
- [x] 12.7 Implement notification sending functionality
- [x] 12.8 Replace RN Alert with react-hot-toast notifications
- [ ] 12.9 Test notification creation and delivery

## 13. Schedules Management Pages

- [x] 13.1 Create `src/pages/schedules/index.astro` for schedule list
- [x] 13.2 Copy `useAdminSchedules` hook
- [x] 13.3 Create `src/components/admin/schedules/ScheduleCard.tsx`
- [x] 13.4 Implement schedule list organized by trip
- [x] 13.5 Create schedule creation modal/form
- [x] 13.6 Use native `input[type="date"]` and `input[type="time"]` for date/time selection
- [x] 13.7 Implement schedule editing functionality
- [ ] 13.8 Test schedule CRUD operations

## 14. Transactions View Page

- [x] 14.1 Create `src/pages/transactions/index.astro` for transaction list
- [x] 14.2 Copy `useAdminTransactions` hook
- [x] 14.3 Create `src/components/admin/transactions/TransactionCard.tsx`
- [x] 14.4 Implement transaction list with pagination
- [x] 14.5 Create transaction filters component
- [x] 14.6 Implement filter by user, date range, and transaction type
- [ ] 14.7 Test transaction viewing with filters

## 15. Coins Management Pages

- [x] 15.1 Create `src/pages/coins/index.astro` for coins overview
- [x] 15.2 Copy `useAdminCoins` hook
- [x] 15.3 Create `src/pages/coins/add.astro` for adding coins
- [x] 15.4 Create add coins form with user selection
- [x] 15.5 Implement add coins functionality
- [x] 15.6 Create `src/pages/coins/remove.astro` for removing coins
- [x] 15.7 Implement remove coins functionality
- [ ] 15.8 Test coin operations and verify transactions are recorded

## 16. Activities Management Pages

- [x] 16.1 Create `src/pages/activity/index.astro` for activity list
- [x] 16.2 Copy activity-related hooks
- [x] 16.3 Create activity card component
- [x] 16.4 Create `src/pages/activity/new.astro` for creating activities
- [x] 16.5 Implement activity creation form
- [x] 16.6 Create `src/pages/activity/edit/[activityId].astro` for editing
- [x] 16.7 Implement activity editing form
- [ ] 16.8 Test activity CRUD operations

## 17. Testing and Bug Fixes

- [x] 17.1 Manual test all admin pages for functionality
- [ ] 17.2 Compare behavior with React Native admin panel
- [ ] 17.3 Test OTP authentication flow thoroughly
- [x] 17.4 Test all CRUD operations across different admin sections
- [x] 17.5 Test pagination and search functionality
- [ ] 17.6 Test image uploads and file handling
- [x] 17.7 Test error handling and validation messages
- [ ] 17.8 Test complete challenge lifecycle (create → submissions → voting → judging → completion)
- [ ] 17.9 Test submission review, voting, and judgment interfaces thoroughly
- [x] 17.10 Fix any bugs discovered during testing
- [ ] 17.11 Test on different browsers (Chrome, Firefox, Safari)
- [ ] 17.12 Test responsive behavior (if applicable)

## 18. Performance Optimization

## 18. Performance Optimization

- [ ] 18.1 Analyze bundle size and optimize imports
- [ ] 18.2 Implement code splitting for large pages
- [ ] 18.3 Optimize image loading with lazy loading
- [ ] 18.4 Review and optimize tRPC query caching strategies
- [ ] 18.5 Test page load times and optimize slow pages
- [ ] 18.6 Implement loading skeletons for better perceived performance

## 19. Deployment Preparation

## 19. Deployment Preparation

- [ ] 19.1 Create Dockerfile for admin web app
- [ ] 19.2 Configure environment variables for production
- [ ] 19.3 Set up production build script
- [ ] 19.4 Test production build locally
- [ ] 19.5 Document deployment process in README
- [ ] 19.6 Set up CI/CD pipeline for admin web app
- [ ] 19.7 Configure separate domain (e.g., admin.mirai-app.com) with DNS
- [ ] 19.8 Set up SSL certificate for admin domain
- [ ] 19.9 Deploy to staging environment for testing
- [ ] 19.10 Perform security review of authentication flow and domain isolation
- [ ] 19.11 Deploy to production environment
- [ ] 19.12 Monitor initial deployment for errors and performance

## 20. React Native App Cleanup

- [ ] 20.1 Remove `apps/native/src/app/(tabs)/admin/` directory
- [ ] 20.2 Remove `apps/native/src/components/admin/` directory
- [ ] 20.3 Remove `apps/native/src/hooks/admin/` directory
- [ ] 20.4 Update React Native app navigation to remove admin tab
- [ ] 20.5 Remove admin-related routes from React Native routing
- [ ] 20.6 Test React Native app builds successfully without admin code
- [ ] 20.7 Verify reduced bundle size of React Native app
- [ ] 20.8 Update React Native app documentation

## 21. Documentation and Handoff

- [ ] 21.1 Create `apps/admin-web/README.md` with setup instructions
- [ ] 21.2 Document environment variables required
- [ ] 21.3 Document OTP authentication flow (6-digit numeric code via email)
- [ ] 21.4 Document admin role requirements
- [ ] 21.5 Document deployment process
- [ ] 21.6 Update monorepo root README with admin web app information
- [ ] 21.7 Create admin user guide including challenge management workflows
- [ ] 21.8 Update architecture documentation with new admin web app
