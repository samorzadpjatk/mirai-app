## ADDED Requirements

### Requirement: Dashboard page

The system SHALL provide dashboard page at `/` with overview statistics and navigation to admin sections.

#### Scenario: Dashboard renders

- **WHEN** authenticated admin user visits root path
- **THEN** dashboard page displays with statistics cards

#### Scenario: Navigation tiles present

- **WHEN** dashboard loads
- **THEN** navigation tiles for all admin sections are visible

#### Scenario: Statistics displayed

- **WHEN** dashboard loads
- **THEN** key metrics (user count, active challenges, etc.) are fetched and displayed

### Requirement: Users management pages

The system SHALL provide pages for listing, creating, and editing user accounts.

#### Scenario: User list page

- **WHEN** admin visits `/users`
- **THEN** paginated list of users is displayed with search and filter options

#### Scenario: Create user page

- **WHEN** admin visits `/users/new`
- **THEN** form for creating new user is displayed

#### Scenario: Edit user page

- **WHEN** admin visits `/users/edit/[userId]`
- **THEN** form pre-filled with user data is displayed

#### Scenario: User created successfully

- **WHEN** admin submits valid user creation form
- **THEN** user is created and admin is redirected to user list

### Requirement: Groups management pages

The system SHALL provide pages for managing user groups and group assignments.

#### Scenario: Group list page

- **WHEN** admin visits `/groups`
- **THEN** list of groups is displayed with member counts

#### Scenario: Create group page

- **WHEN** admin visits `/groups/new`
- **THEN** form for creating new group is displayed

#### Scenario: Edit group page

- **WHEN** admin visits `/groups/edit/[groupId]`
- **THEN** form with group details and member management is displayed

#### Scenario: Group assignment modal

- **WHEN** admin assigns users to group
- **THEN** modal displays available users with selection interface

### Requirement: Challenges management pages

The system SHALL provide pages for managing challenges, submissions, voting, and judgment.

#### Scenario: Challenge list page

- **WHEN** admin visits `/challenges`
- **THEN** list of challenges is displayed with status filters

#### Scenario: Create challenge page

- **WHEN** admin visits `/challenges/new`
- **THEN** form for creating challenge with all fields is displayed

#### Scenario: Challenge detail page

- **WHEN** admin visits `/challenges/[id]`
- **THEN** challenge details with submissions are displayed

#### Scenario: Submissions review page

- **WHEN** admin visits `/challenges/submissions`
- **THEN** pending submissions are displayed for review

#### Scenario: Staff voting page

- **WHEN** admin visits `/challenges/staff-vote`
- **THEN** interface for staff voting on submissions is displayed

#### Scenario: Judgment page

- **WHEN** admin visits `/challenges/judgement`
- **THEN** interface for final judgment and winner selection is displayed

### Requirement: Rewards management pages

The system SHALL provide pages for managing rewards that users can redeem.

#### Scenario: Reward list page

- **WHEN** admin visits `/rewards`
- **THEN** list of available rewards is displayed

#### Scenario: Create reward page

- **WHEN** admin visits `/rewards/new`
- **THEN** form for creating new reward is displayed

#### Scenario: Edit reward page

- **WHEN** admin visits `/rewards/edit/[rewardId]`
- **THEN** form with reward details is displayed for editing

#### Scenario: Reward image upload

- **WHEN** admin uploads reward image
- **THEN** image is stored in Supabase storage and URL is saved

### Requirement: Notifications management pages

The system SHALL provide pages for creating and managing push notifications.

#### Scenario: Notification list page

- **WHEN** admin visits `/notifications`
- **THEN** list of sent notifications is displayed with filters

#### Scenario: Create notification page

- **WHEN** admin visits `/notifications/new`
- **THEN** form for composing notification with target selection is displayed

#### Scenario: Notification sent

- **WHEN** admin submits notification form
- **THEN** notification is queued for delivery to selected users

### Requirement: Schedules management pages

The system SHALL provide pages for managing trip schedules and activities.

#### Scenario: Schedule list page

- **WHEN** admin visits `/schedules`
- **THEN** list of schedules organized by trip is displayed

#### Scenario: Schedule creation modal

- **WHEN** admin creates new schedule item
- **THEN** modal with date, time, and description fields is displayed

#### Scenario: Schedule editing

- **WHEN** admin edits existing schedule
- **THEN** pre-filled modal allows modification of schedule details

### Requirement: Transactions view page

The system SHALL provide read-only page for viewing coin transaction history.

#### Scenario: Transaction list page

- **WHEN** admin visits `/transactions`
- **THEN** paginated list of all transactions is displayed

#### Scenario: Transaction filters

- **WHEN** admin applies filters
- **THEN** transactions are filtered by user, date range, or transaction type

#### Scenario: Transaction details

- **WHEN** admin clicks transaction
- **THEN** full transaction details including user and reason are displayed

### Requirement: Coins management pages

The system SHALL provide pages for adding or removing coins from user accounts.

#### Scenario: Coins overview page

- **WHEN** admin visits `/coins`
- **THEN** summary of coin operations and quick actions are displayed

#### Scenario: Add coins page

- **WHEN** admin visits `/coins/add`
- **THEN** form for adding coins to user account is displayed

#### Scenario: Remove coins page

- **WHEN** admin visits `/coins/remove`
- **THEN** form for removing coins from user account is displayed

#### Scenario: Coins operation completed

- **WHEN** admin submits coin operation
- **THEN** user's balance is updated and transaction is recorded

### Requirement: Activities management pages

The system SHALL provide pages for managing trip activities and schedules.

#### Scenario: Activity list page

- **WHEN** admin visits `/activity`
- **THEN** list of activities is displayed

#### Scenario: Create activity page

- **WHEN** admin visits `/activity/new`
- **THEN** form for creating new activity is displayed

#### Scenario: Edit activity page

- **WHEN** admin visits `/activity/edit/[activityId]`
- **THEN** form with activity details is displayed for editing
