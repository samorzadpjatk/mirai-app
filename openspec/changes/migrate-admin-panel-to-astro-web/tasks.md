## 1. Project Setup and Configuration

- [ ] 1.1 Initialize Astro project at `apps/admin-web` with TypeScript template
- [ ] 1.2 Configure `tsconfig.json` to extend `../../tsconfig.base.json`
- [ ] 1.3 Add `apps/admin-web` to root `package.json` workspaces array
- [ ] 1.4 Add admin-web build, dev, lint, and typecheck tasks to `turbo.json`
- [ ] 1.5 Add `dev:admin-web` script to root `package.json`
- [ ] 1.6 Install Astro React integration: `@astrojs/react`
- [ ] 1.7 Configure `astro.config.mjs` with React integration and server/hybrid output mode
- [ ] 1.8 Add shared package dependencies: `@mirai-app/auth`, `@mirai-app/trpc`, `@mirai-app/db`, `@mirai-app/supabase`, `@mirai-app/shared` as workspace dependencies
- [ ] 1.9 Install web-specific dependencies: `react`, `react-dom`, `@tanstack/react-query`
- [ ] 1.10 Create base directory structure: `src/pages/`, `src/components/`, `src/layouts/`, `src/lib/`, `src/hooks/`
- [ ] 1.11 Install and configure Tailwind CSS with Astro integration
- [ ] 1.12 Create Tailwind config extending base theme for custom design tokens
- [ ] 1.13 Create `.env` file with Supabase credentials for development
- [ ] 1.14 Verify `bun run dev` starts development server successfully
- [ ] 1.15 Verify `bun run build` completes without errors

## 2. Authentication Infrastructure

- [ ] 2.1 Create `src/lib/auth.ts` to initialize auth using `@mirai-app/auth` package
- [ ] 2.2 Verify `@mirai-app/auth` package works in browser environment (no React Native dependencies)
- [ ] 2.3 Create Supabase client initialization in `src/lib/supabase.ts` for web
- [ ] 2.4 Create `src/pages/login.astro` page with OTP login form
- [ ] 2.5 Create `src/components/LoginForm.tsx` React component using `useLoginForm` hook from `@mirai-app/auth`
- [ ] 2.6 Implement OTP email sending flow using existing `signInWithOtp` method (6-digit numeric code)
- [ ] 2.7 Create OTP code input component for users to enter received 6-digit code
- [ ] 2.8 Implement OTP code verification using Supabase Auth `verifyOtp` method
- [ ] 2.9 Handle OTP verification errors (invalid code, expired code)
- [ ] 2.10 Test OTP email delivery and code verification flow end-to-end
- [ ] 2.11 Implement session persistence in browser localStorage/cookies via Supabase
- [ ] 2.12 Create authentication middleware (`src/middleware.ts`) to protect admin routes
- [ ] 2.13 Implement redirect to login page for unauthenticated users
- [ ] 2.14 Verify authenticated users can access protected routes
- [ ] 2.15 Implement admin role verification using tRPC procedure
- [ ] 2.16 Create logout functionality that clears session and redirects to login
- [ ] 2.17 Implement automatic token refresh before expiration
- [ ] 2.18 Test session expiration and redirect to login

## 3. tRPC Client Configuration

- [ ] 3.1 Create `src/lib/trpc.ts` for tRPC client initialization
- [ ] 3.2 Configure tRPC client with HTTP transport (not Expo-specific transport)
- [ ] 3.3 Set backend server URL from environment variable
- [ ] 3.4 Create React Query client configuration
- [ ] 3.5 Create `src/components/TRPCProvider.tsx` wrapper component
- [ ] 3.6 Integrate TRPCProvider in main layout for client components
- [ ] 3.7 Configure authentication headers to include Supabase access token
- [ ] 3.8 Test tRPC query procedure call from client component
- [ ] 3.9 Test tRPC mutation procedure call from client component
- [ ] 3.10 Verify TypeScript type inference works for tRPC calls
- [ ] 3.11 Implement error handling with user-friendly messages
- [ ] 3.12 Test network error handling with retry logic
- [ ] 3.13 Configure optimistic updates for mutation procedures
- [ ] 3.14 Verify tRPC works correctly in Astro islands architecture

## 4. Base Layout and Navigation

- [ ] 4.1 Create `src/layouts/Layout.astro` with HTML boilerplate and meta tags
- [ ] 4.2 Create `src/layouts/AdminLayout.astro` for authenticated admin pages
- [ ] 4.3 Add global CSS styles and fonts
- [ ] 4.4 Create navigation component with links to all admin sections
- [ ] 4.5 Create header component with logout button
- [ ] 4.6 Style navigation to match or improve mobile app navigation
- [ ] 4.7 Implement active route highlighting in navigation
- [ ] 4.8 Test navigation between different admin sections

## 5. Reusable Component Library (Custom with Tailwind CSS)

- [ ] 5.1 Create `src/components/ui/Button.tsx` with variants (primary, secondary, ghost, danger)
- [ ] 5.2 Add Tailwind utility classes for button states (hover, active, disabled)
- [ ] 5.3 Create `src/components/ui/Input.tsx` for text inputs with label and error states
- [ ] 5.4 Create `src/components/ui/DateInput.tsx` wrapper around native `input[type="date"]`
- [ ] 5.5 Create `src/components/ui/TimeInput.tsx` wrapper around native `input[type="time"]`
- [ ] 5.6 Create `src/components/ui/Select.tsx` for dropdowns
- [ ] 5.7 Create `src/components/ui/Modal.tsx` for dialog modals with backdrop
- [ ] 5.8 Create `src/components/ui/Card.tsx` for content cards
- [ ] 5.9 Create `src/components/ui/LoadingSpinner.tsx`
- [ ] 5.10 Create `src/components/ui/ErrorMessage.tsx`
- [ ] 5.11 Install react-hot-toast: `bun add react-hot-toast`
- [ ] 5.12 Configure react-hot-toast Toaster component in main layout
- [ ] 5.13 Create toast wrapper utility in `src/lib/toast.ts` for consistent API (success, error, info)
- [ ] 5.14 Test all base components render correctly with Tailwind styles
- [ ] 5.15 Test toast notifications display correctly

## 6. Dashboard Page

- [ ] 6.1 Create `src/pages/index.astro` for admin dashboard
- [ ] 6.2 Create `src/components/admin/AdminStats.tsx` component (migrate from RN)
- [ ] 6.3 Create `src/components/admin/AdminTile.tsx` navigation tiles (migrate from RN)
- [ ] 6.4 Fetch and display statistics using tRPC queries
- [ ] 6.5 Implement navigation tiles for all admin sections
- [ ] 6.6 Style dashboard to be desktop-friendly
- [ ] 6.7 Test dashboard loads with correct data

## 7. Users Management Pages

- [ ] 7.1 Create `src/pages/users/index.astro` for user list
- [ ] 7.2 Copy `useAdminUsers` hook from RN to `src/hooks/admin/useAdminUsers.ts` (no changes needed - pure tRPC/React Query)
- [ ] 7.3 Create `src/components/admin/users/UserCard.tsx` (copy from RN, replace View/Text with div/span, apply Tailwind)
- [ ] 7.4 Implement user list with pagination and search
- [ ] 7.5 Create `src/pages/users/new.astro` for creating users
- [ ] 7.6 Create `src/components/admin/users/CreateUserForm.tsx` (adapt from RN CreateUserModal, remove modal wrapper)
- [ ] 7.7 Implement user creation form with validation
- [ ] 7.8 Replace Alert.alert() with react-hot-toast (toast.success, toast.error)
- [ ] 7.9 Create `src/pages/users/edit/[userId].astro` for editing users
- [ ] 7.10 Create `src/components/admin/users/EditUserForm.tsx` (adapt from RN EditUserModal)
- [ ] 7.11 Implement user editing form with pre-filled data
- [ ] 7.12 Test user CRUD operations end-to-end

## 8. Groups Management Pages

- [ ] 8.1 Create `src/pages/groups/index.astro` for group list
- [ ] 8.2 Copy `useAdminGroups` hook (no changes needed - pure tRPC/React Query)
- [ ] 8.3 Create `src/components/admin/groups/GroupCard.tsx` (copy from RN, apply Tailwind)
- [ ] 8.4 Implement group list with search functionality
- [ ] 8.5 Create `src/pages/groups/new.astro` for creating groups
- [ ] 8.6 Create group creation form (adapt from RN GroupModals)
- [ ] 8.7 Create `src/pages/groups/edit/[groupId].astro` for editing groups
- [ ] 8.8 Implement group assignment modal/component for adding members
- [ ] 8.9 Replace RN Alert with react-hot-toast notifications
- [ ] 8.10 Test group CRUD operations

## 9. File Upload Infrastructure (for Rewards/Challenges)

- [ ] 9.1 Create `src/hooks/useWebFileUpload.ts` for Supabase Storage uploads
- [ ] 9.2 Implement file selection using HTML `<input type="file">`
- [ ] 9.3 Add image preview using `URL.createObjectURL()`
- [ ] 9.4 Implement upload progress tracking
- [ ] 9.5 Add error handling for upload failures
- [ ] 9.6 Create helper utilities for file validation (size, type)
- [ ] 9.7 Test file upload to Supabase Storage bucket
- [ ] 9.8 Verify uploaded files accessible via public URL

## 10. Challenges Management Pages (Full Implementation)

### 10.A Basic Challenge CRUD

- [ ] 10.1 Create `src/pages/challenges/index.astro` for challenge list
- [ ] 10.2 Copy `useAdminChallenges` hook (minimal changes - pure tRPC/React Query)
- [ ] 10.3 Create `src/components/admin/challenges/ChallengeCard.tsx` (copy from RN, apply Tailwind)
- [ ] 10.4 Implement challenge list with status filters (draft, active, voting, judging, completed)
- [ ] 10.5 Add search and sorting functionality for challenges

### 10.B Challenge Creation Form (Full Features)

- [ ] 10.6 Create `src/pages/challenges/new.astro` for creating challenges
- [ ] 10.7 Copy and adapt `useChallengeForm` hook from RN to `src/hooks/admin/useChallengeForm.ts`
- [ ] 10.8 Replace `Alert.alert()` with react-hot-toast (toast.success, toast.error, toast.loading)
- [ ] 10.9 Replace `expo-image-picker` with web file input for cover image
- [ ] 10.10 Create `src/components/admin/challenges/ChallengeForm.tsx` with all fields:
  - [ ] Title, description, and instructions
  - [ ] Cover image upload with preview
  - [ ] Points/rewards configuration
  - [ ] Challenge type selection (photo, video, text, etc.)
  - [ ] Start and end dates
  - [ ] Voting settings (peer voting enabled, vote weight)
  - [ ] Judgment settings (staff judging enabled, scoring criteria)
  - [ ] Trip association
  - [ ] Group/participant restrictions
- [ ] 10.11 Implement image upload for challenge cover using `useWebFileUpload`
- [ ] 10.12 Add validation for all form fields
- [ ] 10.13 Test challenge creation with image upload

### 10.C Challenge Editing

- [ ] 10.14 Create `src/pages/challenges/edit/[id].astro` for editing challenges
- [ ] 10.15 Reuse `ChallengeForm` component with edit mode
- [ ] 10.16 Pre-populate form with existing challenge data
- [ ] 10.17 Handle cover image replacement
- [ ] 10.18 Test challenge editing workflow

### 10.D Challenge Details and Management

- [ ] 10.19 Create `src/pages/challenges/[id].astro` for challenge details
- [ ] 10.20 Display full challenge information
- [ ] 10.21 Show challenge status and timeline
- [ ] 10.22 Add action buttons (start voting, start judging, complete, delete)
- [ ] 10.23 Implement challenge state transitions

### 10.E Submissions Review Interface

- [ ] 10.24 Create `src/pages/challenges/[id]/submissions.astro` for submission review
- [ ] 10.25 Copy submission-related hooks from RN
- [ ] 10.26 Create `src/components/admin/challenges/SubmissionCard.tsx`
- [ ] 10.27 Display all submissions with user info, timestamp, and content
- [ ] 10.28 Implement submission image/video viewing (modal or lightbox)
- [ ] 10.29 Add submission filtering (by status, user, score)
- [ ] 10.30 Implement submission moderation actions (approve, reject, flag)
- [ ] 10.31 Test submission review workflow

### 10.F Staff Voting Interface

- [ ] 10.32 Create `src/pages/challenges/[id]/voting.astro` for staff voting
- [ ] 10.33 Copy voting-related hooks from RN
- [ ] 10.34 Create `src/components/admin/challenges/VotingCard.tsx`
- [ ] 10.35 Display submissions in voting format
- [ ] 10.36 Implement voting controls (upvote, downvote, or rating scale)
- [ ] 10.37 Show current vote tallies and rankings
- [ ] 10.38 Prevent duplicate voting by same staff member
- [ ] 10.39 Add voting period countdown/timer
- [ ] 10.40 Test staff voting workflow

### 10.G Judgment Interface

- [ ] 10.41 Create `src/pages/challenges/[id]/judging.astro` for judgment
- [ ] 10.42 Copy judgment-related hooks from RN
- [ ] 10.43 Create `src/components/admin/challenges/JudgmentForm.tsx`
- [ ] 10.44 Display submissions with voting results
- [ ] 10.45 Implement scoring interface with criteria-based evaluation
- [ ] 10.46 Add notes/feedback for each submission
- [ ] 10.47 Implement final ranking assignment
- [ ] 10.48 Show winner selection and point distribution
- [ ] 10.49 Add "complete challenge" action that finalizes results
- [ ] 10.50 Test judgment workflow end-to-end

### 10.H Challenge Analytics (if available in RN)

- [ ] 10.51 Add participation statistics (submissions count, participation rate)
- [ ] 10.52 Display voting analytics (votes per submission, voter participation)
- [ ] 10.53 Show completion timeline and milestones
- [ ] 10.54 Test analytics display

## 11. Rewards Management Pages

- [ ] 11.1 Create `src/pages/rewards/index.astro` for reward list
- [ ] 11.2 Copy reward-related hooks
- [ ] 11.3 Create reward card component with Tailwind styling
- [ ] 11.4 Create `src/pages/rewards/new.astro` for creating rewards
- [ ] 11.5 Create reward creation form
- [ ] 11.6 Implement image upload for reward images using `useWebFileUpload`
- [ ] 11.7 Add image preview before upload
- [ ] 11.8 Create `src/pages/rewards/edit/[rewardId].astro` for editing rewards
- [ ] 11.9 Implement reward edit form with existing image display
- [ ] 11.10 Test reward CRUD operations with image uploads

## 12. Notifications Management Pages

- [ ] 12.1 Create `src/pages/notifications/index.astro` for notification list
- [ ] 12.2 Copy `useAdminNotifications` hook
- [ ] 12.3 Create `src/components/admin/notifications/NotificationCard.tsx`
- [ ] 12.4 Implement notification list with filters
- [ ] 12.5 Create `src/pages/notifications/new.astro` for creating notifications
- [ ] 12.6 Create notification creation form with target user selection
- [ ] 12.7 Implement notification sending functionality
- [ ] 12.8 Replace RN Alert with react-hot-toast notifications
- [ ] 12.9 Test notification creation and delivery

## 13. Schedules Management Pages

- [ ] 13.1 Create `src/pages/schedules/index.astro` for schedule list
- [ ] 13.2 Copy `useAdminSchedules` hook
- [ ] 13.3 Create `src/components/admin/schedules/ScheduleCard.tsx`
- [ ] 13.4 Implement schedule list organized by trip
- [ ] 13.5 Create schedule creation modal/form
- [ ] 13.6 Use native `input[type="date"]` and `input[type="time"]` for date/time selection
- [ ] 13.7 Implement schedule editing functionality
- [ ] 13.8 Test schedule CRUD operations

## 14. Transactions View Page

- [ ] 14.1 Create `src/pages/transactions/index.astro` for transaction list
- [ ] 14.2 Copy `useAdminTransactions` hook
- [ ] 14.3 Create `src/components/admin/transactions/TransactionCard.tsx`
- [ ] 14.4 Implement transaction list with pagination
- [ ] 14.5 Create transaction filters component
- [ ] 14.6 Implement filter by user, date range, and transaction type
- [ ] 14.7 Test transaction viewing with filters

## 15. Coins Management Pages

- [ ] 15.1 Create `src/pages/coins/index.astro` for coins overview
- [ ] 15.2 Copy `useAdminCoins` hook
- [ ] 15.3 Create `src/pages/coins/add.astro` for adding coins
- [ ] 15.4 Create add coins form with user selection
- [ ] 15.5 Implement add coins functionality
- [ ] 15.6 Create `src/pages/coins/remove.astro` for removing coins
- [ ] 15.7 Implement remove coins functionality
- [ ] 15.8 Test coin operations and verify transactions are recorded

## 16. Activities Management Pages

- [ ] 16.1 Create `src/pages/activity/index.astro` for activity list
- [ ] 16.2 Copy activity-related hooks
- [ ] 16.3 Create activity card component
- [ ] 16.4 Create `src/pages/activity/new.astro` for creating activities
- [ ] 16.5 Implement activity creation form
- [ ] 16.6 Create `src/pages/activity/edit/[activityId].astro` for editing
- [ ] 16.7 Implement activity editing form
- [ ] 16.8 Test activity CRUD operations

## 17. Testing and Bug Fixes

- [ ] 17.1 Manual test all admin pages for functionality
- [ ] 17.2 Compare behavior with React Native admin panel
- [ ] 17.3 Test OTP authentication flow thoroughly
- [ ] 17.4 Test all CRUD operations across different admin sections
- [ ] 17.5 Test pagination and search functionality
- [ ] 17.6 Test image uploads and file handling
- [ ] 17.7 Test error handling and validation messages
- [ ] 17.8 Test complete challenge lifecycle (create → submissions → voting → judging → completion)
- [ ] 17.9 Test submission review, voting, and judgment interfaces thoroughly
- [ ] 17.10 Fix any bugs discovered during testing
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
