## ADDED Requirements

### Requirement: Authentication initialization

The system SHALL initialize authentication using `@mirai-app/auth` package with browser-compatible Supabase client.

#### Scenario: Auth package imported

- **WHEN** auth module is created
- **THEN** `@mirai-app/auth` is imported without React Native dependencies

#### Scenario: Supabase client configured

- **WHEN** application starts
- **THEN** Supabase client is initialized with correct project URL and anon key

#### Scenario: Browser storage used

- **WHEN** user authenticates
- **THEN** session is persisted in browser localStorage or cookies

### Requirement: OTP passwordless login page

The system SHALL provide login page for admin users with OTP (one-time password) passwordless authentication using 6-digit numeric codes sent via email, matching the React Native app's authentication flow.

#### Scenario: Login form rendered

- **WHEN** unauthenticated user visits admin site
- **THEN** login page displays email input field (no password field)

#### Scenario: OTP code sent

- **WHEN** user submits valid email address
- **THEN** 6-digit OTP code is sent to user's email via Supabase Auth

#### Scenario: Email sent confirmation

- **WHEN** OTP email is successfully sent
- **THEN** user sees confirmation message to check their email and input field for OTP code appears

#### Scenario: OTP code verification

- **WHEN** user enters received 6-digit OTP code
- **THEN** code is verified against Supabase Auth

#### Scenario: Successful OTP verification

- **WHEN** user submits correct OTP code
- **THEN** user is authenticated and redirected to admin dashboard

#### Scenario: Invalid OTP code

- **WHEN** user submits incorrect OTP code
- **THEN** error message is displayed and user can retry

#### Scenario: Expired OTP code

- **WHEN** user submits expired OTP code
- **THEN** error message indicates code has expired and user must request new code

#### Scenario: Invalid email format

- **WHEN** user submits invalid email format
- **THEN** validation error is displayed

#### Scenario: Session persisted

- **WHEN** user refreshes page after login
- **THEN** user remains authenticated without re-login

### Requirement: Authentication middleware

The system SHALL implement middleware to protect admin routes from unauthenticated access.

#### Scenario: Protected route accessed while unauthenticated

- **WHEN** unauthenticated user tries to access admin page
- **THEN** user is redirected to login page

#### Scenario: Protected route accessed while authenticated

- **WHEN** authenticated user tries to access admin page
- **THEN** page renders normally without redirect

#### Scenario: Session expired

- **WHEN** user's session expires during browsing
- **THEN** user is redirected to login page on next navigation

### Requirement: Admin role verification

The system SHALL verify user has admin role before granting access to admin panel.

#### Scenario: User with admin role

- **WHEN** authenticated user with admin role accesses admin panel
- **THEN** access is granted and dashboard renders

#### Scenario: User without admin role

- **WHEN** authenticated user without admin role accesses admin panel
- **THEN** access is denied with appropriate error message

#### Scenario: Role check via tRPC

- **WHEN** admin role is verified
- **THEN** tRPC procedure confirms user has admin permissions

### Requirement: Logout functionality

The system SHALL provide logout functionality that clears session and redirects to login page.

#### Scenario: User initiates logout

- **WHEN** user clicks logout button
- **THEN** session is cleared from browser storage

#### Scenario: Redirect after logout

- **WHEN** logout completes
- **THEN** user is redirected to login page

#### Scenario: Session cleared

- **WHEN** user logs out
- **THEN** subsequent requests are unauthenticated

### Requirement: Session refresh

The system SHALL automatically refresh authentication tokens before expiration to maintain seamless user experience.

#### Scenario: Token expiring soon

- **WHEN** auth token approaches expiration
- **THEN** system automatically requests new token

#### Scenario: Refresh succeeds

- **WHEN** token refresh completes successfully
- **THEN** user continues working without interruption

#### Scenario: Refresh fails

- **WHEN** token refresh fails
- **THEN** user is logged out and redirected to login page
